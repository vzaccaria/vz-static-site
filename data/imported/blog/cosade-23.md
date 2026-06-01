---
title: Efficient Attack-Surface Exploration for Electromagnetic Fault Injection 
date: 2023-04-08
category: blog
authors: ['default']
tags: ['topics/cryptography', 'topics/fault topics/injection']
summary:
  'Together with one of my former students and Security Pattern researchers, we recently presented a paper at Cosade 2023 that explores the use of low-cost devices to execute such attacks.'
---

As technology progresses, System-on-Chips (SoCs) are becoming increasingly prevalent in critical applications, such as secure payments and infrastructure management. However, their intricate nature can render them susceptible to attacks like fault injection. Fault injection is a technique utilized to disrupt the nominal operation of a circuit and expose its vulnerabilities. Although physical access is necessary for this method, electromagnetic pulse injection (EMFI) presents a potentially less expensive means of executing it, albeit with challenges in precision and equipment configuration. Together with one of my former students (now at STMicro) and [Security Pattern researchers](https://www.securitypattern.com/), we recently presented a paper at [Cosade 2023](https://link.springer.com/chapter/10.1007/978-3-031-29497-6_2) that explores the use of low-cost devices, namely a [NewAE Chipshouter](https://www.newae.com/products/NAE-CW520#:~:text=The%20ChipSHOUTER%C2%AE%20(CW520)%20is%20a%20low-cost,%20quickly%20characterize%20vulnerabilities%20in%20embedded%20systems.) and a 3D printer, to execute such attacks.

![The attack setup](/static/images/setupoverv.png)

Instead of relying on guesswork, we've developed a special *bisection* method to move the injection probe with the 3d printer. We've discovered that this new method allows us to find faults at a much faster rate than other methods. In fact, we were able to reduce the search space by five times in a specific use case (which we can't disclose) finding faults with an average probability of 26.7% in all susceptible coordinates, some reaching as high as 97.6%.

This approach has proven successful, uncovering three times more faults than a random search on selected coordinates. This supports our belief that fault points are best located at the equilibrium between positions that completely break the system and safe positions. While there is still work to be done in examining parameters such as probe angle, type, size, and winding, our results have been promising. We're excited to continue pushing forward with future work in pursuit of even more discoveries.

Reach out if you are interested in doing a thesis in applied cryptography!