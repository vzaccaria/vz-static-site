---
title: ConceptOS, A Micro-Kernel Approach to Firmware Updates of Always-On Resource-Constrained Hubris-Based IoT Systems
date: 2024-02-10
category: blog
authors:
  - default
tags:
  - topics/operating-systems
  - topics/rust
  - topics/security
summary: Together with one of my former students, we recently published a paper on the IEEE Internet of Things Journal that component-level updates with live state transfer in an existing embedded operating system for flash-based microcontrollers.
---


In the ever-evolving realm of Internet of Things (IoT) devices, my colleague Andrea Aspesi and I have been dedicated to finding innovative solutions to the challenges posed by the limited resources of these devices and the critical need for seamless firmware updates. Our latest work, [published in the IEEE Internet of Things Journal](https://ieeexplore.ieee.org/document/10361277), introduces ConceptOS - a novel approach we developed to fundamentally transform firmware updates for always-on and resource-constrained IoT devices, leveraging the potential of the [Oxide's Hubris micro-kernel](https://hubris.oxide.computer/reference/).

The digital world is set to experience a surge in connected IoT devices, with projections indicating a rise to 27.0 billion by 2025. This anticipated growth underscores the urgency for an efficient mechanism to address device functionality or security vulnerabilities through remote system updates. Traditional methods of accomplishing this, unfortunately, come with significant drawbacks. They either require extensive onboard storage for dual images or depend on delta updates that, albeit reducing the use of onboard flash memory, have their limitations.

Our breakthrough with ConceptOS transcends these conventional methods by offering a micro-kernel approach that enables component-level updates with live state transfer. This eliminates the need for exhaustive onboard storage and ensures the continuous operation of the device. Unlike the traditional OTA (Over-The-Air) updates, which heavily rely on having significant memory for storing spare images or the complex and less reliable in-place updates, ConceptOS reduces the extra storage space requirement by 21% and significantly decreases system unavailability by 53.8%.

At its core, ConceptOS adopts a novel component-based approach. In this, each component—comprising a set of related functions and data—is built separately and seamlessly integrated into the system. This allows us to apply updates without necessitating a restart. Remarkably, this method minimizes overhead to a level that is comparable to the time it takes to erase a single page, offering an efficient and practical solution for always-on devices.

![ConceptOS flash memory address space format](images/Pasted%20image%2020240210161836.png)

In our publication, we delve into the current OTA updates landscape, highlighting the limitations and inefficiencies faced, especially by low-resource devices operating as unikernels. We also bring to light the challenges encountered in generating correct Position-Independent Code (PIC) for embedded systems and address the inefficiency surrounding the storage and transmission of entire system images for updates.

![The zoo of data relocation mechanisms for microcontrollers](images/Pasted%20image%2020240210161949.png)
To showcase the effectiveness of ConceptOS, Andrea and I conducted a comparative analysis against traditional OTA methods, concentrating on actual memory requirements and overhead, including system unavailability and syscall latency. The results emphatically demonstrate ConceptOS’s superiority in enabling smoother and more resource-efficient updates.

As the IoT ecosystem continues to burgeon, the introduction of ConceptOS represents a significant leap forward in addressing the pressing firmware update issues in embedded systems. Our work not only exemplifies the spirit of innovation within embedded systems engineering but also paves the way for future advancements in IoT device management and efficiency.

You can read the [full paper here](https://ieeexplore.ieee.org/document/10361277).