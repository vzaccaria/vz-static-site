---
title: Interruptible Remote Attestation of Low-End IoT Microcontrollers via Performance Counters
date: 2023-09-12
category: blog
authors:
  - default
tags:
  - topics/attestation
  - topics/machine-learning
  - topics/security
summary: Together with one of my former students, we recently published a paper on the ACM Transactions on Embedded Computing Systems that explores alternative ways of performing remote attestation
---

If you have an interest in distributed systems and cybersecurity, our recent project may appeal to you. With D. Li Calsi (TUM) [we've been investigating remote attestation (RA)](https://dl.acm.org/doi/10.1145/3611674), a method for detecting system integrity violations on a device from a separate location. 

Typically, remote attestation involves computing a unique hash from the target device's memory, which is then compared to a known 'good state' hash by another device. This procedure usually necessitates disabling interrupts on the target device to maintain accuracy and integrity.

![](/static/images/Pasted%20image%2020230912171515.png)

Our research introduces a new technique named "Counters Help Against Roving Malware," which enables interruptible remote attestation, even with concurrent tasks running on the target device. We accomplish this by utilizing hardware performance counters (HPC) on the target device's side and incorporating machine learning techniques at the verifier's end.

We tested our approach across different scenarios (linear regression, decision trees and support vector machines) and found that while SVM proved most effective when using only hardware performance counters (see F1 score in the first diagram below), integrating application event counters boosted prediction accuracy even for simpler models (see the second diagram). 

![](/static/images/Pasted%20image%2020230912171736.png)


![](/static/images/Pasted%20image%2020230912171913.png)
Data manipulation techniques also contributed to improving prediction accuracy. However, it should be noted that our method had low overheads when relying only on hardware performance counters; adding application event counters resulted in higher overheads due to their need for software management on the prover side.

In summary, our research demonstrates that it is possible to perform interruptible remote attestation using hardware performance counters and machine learning techniques, even on constrained microcontrollers. We also shed light on the trade-offs between detection capacity and overheads when deciding which events to monitor.

If you're interested in contributing to our exploration of distributed systems and cybersecurity, please get in touch!

