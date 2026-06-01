---
title: Introductory notes on the new Linux scheduler (EEVDF) 
date: 2025-05-07
category: blog
authors:
  - default
tags:
  - topics/kernel
  - topics/scheduling
summary: I have recently updated the material of my Advanced Operating System course with an analysis of the new EEVDF scheduler. Here are my notes.
---

I've recently updated the material of my Advanced Operating System course with an analysis of the new Linux EEVDF scheduler, which has supplanted the original CFS scheduler. I'll recap here my introductory notes, starting with a brief overview of the original scheduler (CFS).

## The Completely Fair Scheduler (CFS)
CFS stands for “Completely Fair Scheduler,” and was the desktop process scheduler [implemented by Ingo Molnar in Linux kernel version 2.6.23](https://docs.kernel.org/scheduler/sched-design-CFS.html) up until version 6.14.

CFS assigned timeslices $\tau_p$ to each process $p$ dynamically based on total system load which is derived from the nice values $\nu_i$ of all runnable processes:   

$$
\tau_p = f(\nu_0, \ldots, \nu_p, \ldots, \nu_{n-1}, \bar{\tau}, \mu) \sim max(\frac{\lambda_p \bar{\tau}}{\sum\lambda_i}, \mu)
$$
where
- $\lambda_i(\nu_i)$ is the *load* associated with a process, which is a function of the nice value $\nu_i$. It has an exponential formula, i.e., $\lambda_i \simeq b^{-\nu_i}$ (b=1.25). For numerical reasons $\lambda_i$ is stored as weight $w_i=2^{10}\lambda_i$. Most of the time however, the $2^{10}$ factor cancels out, and because it simplifies formulas, we are going to express formulas in terms of $\lambda$ and not $w$.
- $\bar{\tau}$ was called *schedule latency*. Configurable, default 6ms.  It was the targeted time for each process to get a chance to run.
- $\mu$ is called *minimum granularity*. Configurable, default 0.75ms. This ensured that  that every low-priority process got a minimum amount of CPU time. 
- $\frac{\lambda_p}{\sum\lambda_i}$ is the _process share_ of time.

To easily ensure fairness, CFS introduced a  **virtual runtime** `(vruntime)` variable $\rho_p$ **as an absolute measure of the dynamic priority of each process** $p$ whereby processes with lower $\rho$ are given priority because they lag behind.  $\rho_p$ is influenced by the time $\epsilon_p$ that process $p$ has used and is inversely proportional to its load $\lambda_p$. 
The key reason for using $\rho$ is that it offers a straightforward way to directly compare processes with different priorities. Specifically, assuming that all processes start with the same $\rho$, if each of them has been served for the assigned timeslice $\tau_p$, all of them will end up again with the same $\rho$ because they have received the same amount of $\Delta \rho$:

$$
\forall p, ~\Delta\rho_p = \frac{\tau_p}{\lambda_p} = \frac{\bar{\tau}\lambda_p}{\lambda_p \sum\lambda_i} = \frac{\bar{\tau}}{\sum\lambda_i}
$$

If a process has a lower $\rho$ it means that it lags behind and thus must be given priority. In fact, the process chosen for execution is the one with the minimum value of $\rho$, i.e., $\rho_{min}$. Such a variable is tracked as `min_vruntime` in the runqueue and will play a role also in EEVDF.

CFS aimed for fairness but did not account [for latency requirements well](https://lwn.net/Articles/925371/) whereby some processes need quick access to the CPU but don't require much time[^1]. CFS didn't offer a way to express these latency needs a part from specific [latency-nice patches](https://lwn.net/Articles/887842/) (which add a second nice value which controls _when_ the CPU time will be available to that process) but a different and more streamlined solution has been cooking for sometime. Enter EEVDF.

[^1]: Realtime scheduling classes could handle this, but they are somewhat used for privileged operations and can disrupt other processes if not handled well.  Hence, the need for improvement in the normal scheduler.

## Earliest Eligible Virtual Deadline First scheduler

[EEVDF](https://docs.kernel.org/scheduler/sched-eevdf.html), based on a 1995 paper by Ion Stoica and Hussein Abdel-Wahab, has been introduced to address the above issues with latency. Like CFS, as of [kernel 6.14.4](https://elixir.bootlin.com/linux/v6.14.4/source/kernel/sched/fair.c), EEVDF divides CPU time fairly among processes by calculating the processes' "lag," or the difference between expected and actual service time; processes with positive lag are prioritized for scheduling. However, unlike CFS, EEVDF uses the concept of **virtual deadlines** to decide which process to run next allowing it to prioritize the latency-sensitive tasks.

EEVDF, like CFS, tracks the virtual runtime of each process, but introduces also the concept of **global virtual time** at time $t$: 

$$
\rho(t) = \frac{t}{\sum_p \lambda_p}
$$
Intuitively, in an ideal system, if a unit of $\rho(t)$ is passed then every process $p$ should have received an amount of time proportional to its load $\lambda_p$. If for some reason the virtual runtime of a process is less than $\rho(t)$ then we say that the process **lags behind** and is owed CPU time. 

In Linux, there is not an explicit variable that tracks $\rho$. It is usually approximated with a weighted average of virtual runtimes of all running processes:

$$
\bar{\rho}(t) = \frac{\sum_i \lambda_i \rho_i}{\sum_p \lambda_p}
$$
For numerical stability the kernel stores $\bar{\rho}$ in two different variables  called [`avg_vruntime` and `avg_load`](https://elixir.bootlin.com/linux/v6.14.4/source/kernel/sched/fair.c#L612) $\hat{\rho}, \Lambda$:
 
 $$
 \hat{\rho} = \sum_i w_i * (\rho_i - \rho_{min}), ~~\Lambda = \sum_p w_p
 $$
Here,  `min_vruntime` $\rho_{min}(t)$ is used to reduce the magnitudes involved in computations (it is always equal to the minimum value of runtime you can find in the run queue at any given moment). Implicitly the value of $\bar{\rho}$ could always be reconstructed from $\hat{\rho}, \Lambda$ and $\rho_{min}$ as: $\bar{\rho} = \hat{\rho}/\Lambda + \rho_{min}$. 

As in CFS, tasks that are behind in virtual runtime must be given priority. In EEVDF, this means only _eligible_ tasks (those with positive lag) can be scheduled, which ensures fairness.

To compute eligibility for process $p$, the kernel measures the actual process **lag**, i.e., [how much actual time do we owe to a process $p$ at time $t$ relative to the current virtual time](https://elixir.bootlin.com/linux/v6.14.4/source/kernel/sched/fair.c#L680): 

$$
\alpha_p(t) = w_p(\bar{\rho}(t) - \rho_p(t))
$$

A task $p$ is considered eligible when $\rho_p(t) \leq \bar{\rho}(t)$. The kernel tries hard to avoid loss in precision to compute if a task is eligible and in particular [the actual formula used is](https://elixir.bootlin.com/linux/v6.14.4/source/kernel/sched/fair.c#L737) is 

$$
(\rho_p - \rho_{min})\Lambda\leq\hat{\rho}
$$

### Ensuring latency-sensitive operation
To prioritize among eligible tasks, EEVDF uses **virtual deadlines** to decide which process to run next. The virtual deadline represents the urgency with which a process should be scheduled, and the process with the **earliest** (smallest) virtual deadline $\delta$ is chosen to run first. The deadline $\delta$  [is computed as](https://elixir.bootlin.com/linux/v6.14.4/source/kernel/sched/fair.c#L1037) 

$$
\delta_p = \frac{\tau_p}{\lambda_p} + \rho_p
$$
Unlike CFS, the timeslice $\tau_p$ of the process can be [a default timeslice or a custom one set via the `sched_setattr()` system call.](https://elixir.bootlin.com/linux/v6.14.4/source/kernel/sched/fair.c#L1032) The smaller the timeslice, the highest priority will be given to that eligible task. 
