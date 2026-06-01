---
category: blog
date: '2017-12-03'
summary: Cryptography’s current research trends show that there is an increasing concern about identifying if a side-channel countermeasure is vulnerable to higher-order attacks. In this post, I'll recap the major findings of a paper I've co-authored with two colleagues.
tags: ['topics/security', 'topics/sca']
title: Symbolic analysis of side channel countermeasures
---


Cryptography’s current research trends show that there is an increasing concern about identifying if a side-channel countermeasure is vulnerable to higher-order attacks.

In a [recent work published this year on IEEE Trans. on Computers](http://dx.doi.org/10.1109/TC.2016.2635650), me and my co-authors, Elia Bisi (U. Warwick) and Filippo Melzani (Security Pattern), just introduced a new mathematical tool to assess the higher order vulnerability of a hardware cryptographic circuit.

The method empowers the circuit designer to detect if the chosen countermeasure (Boolean masking or some parts of a *threshold implementation*) is effective up to the desired order. Our overarching goal was (and is) to promote the implied statistical reasoning behind the countermeasure into a symbolical one, eventually extending ordinary computer aided design of integrated circuits. I'll recap in this post the major findings.

## Background

A *side-channel attack* corresponds to a set of queries to a *physical observable* whose aim is to identify the value of a master key/sub-key $K$ of the primitive. Cryptographic primitives may expose, through a side-channel, one or many intermediate *sensitive variables* $S$ that are deterministic functions of both the master key $K$ and the public input $P$. To safeguard against a possible vulnerability, a customary solution is to prevent a *sensitive value* $S$ to become *visible*, by processing the following value instead $V = S \oplus M_1 \oplus \cdots \oplus M_d$, where $\oplus$ is the bitwise XOR and $M_1, \ldots, M_d$ are random uniformly distributed values called *masks*. However, this does not rule out the case where some $S$ can be derived from observations of a (data dependent) leakage: $L = \psi(V) + N$ where $\psi$ is a mapping from the Boolean space, often defined to be the Hamming weight function.

## Original findings

We now focus on a specific but very common case where the components of the leakage vector $L$ are of the form $L_i = \sum_{j=1}^v c_{i,j} V_j + N_i$. Moreover, we assume that visible variables are related to masks and sensitive variables by the following matrix expression in $\mathbb{F}_2$:

$$
{V} = C \cdot \begin{bmatrix} {M} \\ {S} \end{bmatrix} = \begin{bmatrix} B & A \end{bmatrix} \cdot \begin{bmatrix} {M} \\ {S} \end{bmatrix} = B{M} \oplus A{S}
$$

In the paper, we have shown that $S$ is vulnerable to a correlation attack on $L$ if there exists a constant row vector ${\epsilon}=(\epsilon_i)_{i=1}^v\in\mathbb{F}_2^v$ such that the product

$$
{\epsilon} {V} = \bigoplus_{i=1}^v \epsilon_i V_i
$$
cancels out any mask contribution (i.e. ${\epsilon} B={0}$). In particular, a vulnerability can be found if and only if the reduced row echelon form of $C$ (i.e., $C_R$) has a sensitive pivot column.

## Example

Consider the following visible variables $(V_1,V_2,V_3,V_4) = {V}$:

$$
\begin{aligned}
V_1 &= S_1 \oplus M_1 \, , \\
V_2 &= S_2 \oplus M_2 \, , \\
V_3 &= S_1 \oplus S_2 \oplus M_1 \oplus M_2 \, , \\
V_4 &= M_1 \oplus M_2 \, .\end{aligned}
$$
which corresponds to the following visible matrix $C$:

$$
C =
\left[ \begin{array}{cc|cc}
1 & 0 & 1 & 0\\
0 & 1 & 0 & 1 \\
1 & 1 & 1 & 1 \\
1 & 1 & 0 & 0 \\
\end{array} \right] \, ,
$$

where the vertical line divides the submatrix $B$, corresponding to the masks $M_1,M_2$, from the submatrix $A$, corresponding to the sensitive variables $S_1,S_2$. The reduced row echelon form of $C$ is

$$
C_R =
\left[ \begin{array}{cc|cc}
1 & 0 & 0 & 1\\
0 & 1 & 0 & 1 \\
0 & 0 & 1 & 1 \\
0 & 0 & 0 & 0 \\
\end{array} \right] \, .
$$
We can see that the column of $S_1$ is a pivot column and thus $S_1$ is vulnerabile.
