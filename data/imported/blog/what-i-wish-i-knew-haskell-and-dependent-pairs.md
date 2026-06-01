---
title: Haskell and dependent pairs
date: 2018-01-27
category: blog
authors:
  - default
tags:
  - topics/haskell
summary: This is a more of a personal memo about dependent typing (and Haskell) than anything else. I expect to write more about this subject as I move forward to other subjects in type theory.
---

This is a more of a personal memo about dependent typing (and Haskell) than anything else. I expect
to write more about this subject as I move forward to other similar subjects.

# Dependent types

When we say that a term $b$ has a dependent type $B$, we are actually saying that its type depends
on the value of another term $a$, i.e., $b: B_a$. Since the simplest case in which we can use a
dependent type involves two terms, we talk about a **dependent pair**.

## Dependent pair

A _dependent pair_ can be informally understood as a pair of two terms $(a,b)$ where $a: A$ and
$b: B_a$. This is also called a _dependent sum_ because it captures the notion that the type is
composed of an algebraic type sum:

$$
(a,b) : \{a_1\} \times B_{a_1} + \{a_2\} \times B_{a_2} \ldots
$$

The above notation is typically synthesized into $$(a,b): \sum_{x:A} B_x$$

One might try to emulate, in Haskell, such a dependent pair out of a `Either` (assume $A=$ `Bool`
and $B_{True}=$ `Int` and $B_{False}=$ `String`):

```haskell
data BoolPair = Either (Bool, Int) (Bool, String)
```

But this one does not rule out pairs such as `Left (False, 3)` which are exactly excluded by the
dependent pair construction above.

## Practical use

Why use a dependent pair? A part from more advanced uses such as proof construction, online
tutorials cite dependent typing as a way to make programs more correct (e.g., avoiding access to
zero sized vector). Others say that dependent types allow to describe more precisely the intended
behavior of programs. The way I see it is that they can reduce the combinatorial space of cases to
consider when building a function. For example,

```haskell
f :: BoolPair -> ...
```

Since `BoolPair` is not a dependent pair, to write `f` you would have to consider, potentially, all
combinations of the cartesian product $Bool \times (String + Int)$. Dependent pairs are effectively
a tool to decrease this complexity and thus information overload.

## How to build one

The first approach one can use to build a dependent pair is to follow the original definition using
singletons. If one could enumerate all $a_i$ at the type level and produce a singleton type for each
of them that would be enough[^1]. Lets consider again the above example.

A dependent pair such as `BoolPair`, i.e.,

$$
\sum_{x:Bool}(\textrm{if~} x
\textrm{~then~} \texttt{Int} \textrm{~else~} \texttt{String})
$$

could be encoded using GADTs, [singletons](https://hackage.haskell.org/package/singletons) and a
type family:

```haskell
{-# LANGUAGE DataKinds #-}
{-# LANGUAGE GADTs #-}
{-# LANGUAGE PolyKinds #-}
{-# LANGUAGE TypeFamilies #-}
{-# LANGUAGE RankNTypes #-}

import Data.Singletons.Prelude

type family   B (x :: Bool)
type instance B 'True = Int
type instance B 'False = String

data BoolPair where
  (:*:) :: forall x. Sing x -> B x -> BoolPair
```

In practice:

- We use GADTs because they allow to define generic sum types and access each "addend" through
  pattern matching. The constructor of each pair is actually the `:*:` operator.
- `x` is special type variable; its kind is `Bool` and here we are using it to enumerate $A$, i.e.,
  as a label that mimicks each inhabitant $a_i \in A$ for which we have to define a singleton.
- `Sing x` transforms each label $x$ into a singleton type $\{x\}$ for which one has to provide
  suitable value constructors (spoiler, the most important are already provided in the
  [singletons](https://hackage.haskell.org/package/singletons-2.4.1/docs/Data-Promotion-Prelude.html)
  library).
- `B x` transforms the same label through the type function $B(x)$ (here we use a type family to
  define it).

A possible usage that type-checks is the following:

```haskell
f :: BoolPair -> String
f (STrue :*: n) = show n
f (SFalse :*: s) = s
```

while the following:

```haskell
f' :: BoolPair -> String
f' (STrue :*: s) = s
```

would give a type-error, because the singleton value `STrue` requires an integer for the second
value of the pair. What about a generic version of pairs that works with a generic `t!=B` and a
generic `s!='Bool`? Look no further than the singletons library which
[has recently introduced sigma types](https://github.com/goldfirere/singletons/issues/256):

```haskell
data Sigma (s :: Type) :: (s ~> Type) -> Type where
  (:&:) :: Sing (fst :: s) -> t @@ fst -> Sigma s t
```

where the type constructor is `:&:` instead of `:*:`.

## Existentials

Recall that a proposition can be seen as _the collection (type) of all possible witnesses of its
truth_ ([propositions as types](https://ncatlab.org/nlab/show/propositions+as+types)). In fact, the
way witnesses are constructed by combining their types follows the way in which truth is combined
through logic operators, provided that one can create a way to build such witnesses through an
expression of a matching type [^2].

Let us now assume that

- $\{ a_i \}$ is the type of the witness that $a_i$ exists.
- $B_{a_i}$ is the type of the witnesses for a proposition that depends on $a_i$.

then the expression of the dependent pair:

$$
(a,b) : \{a_1\} \times B_{a_1} + \{a_2\} \times B_{a_2} \ldots
$$

can be interpreted in logic as

$$
(\exists a_1 \wedge B_{a_1}) \vee  (\exists a_2 \wedge B_{a_2}) \ldots \sim \exists x.B(x)
$$

Which explains why dependent pairs are used to express existentially quantified predicates.

[^1]:
    $a_i$ is an inhabitant of $A$ while ${a_i}$ is a subtype of $A$ that includes only the value
    $a_i$ (i.e., a singleton).

[^2]:
    If $A$ is a collection of witnesses of proposition $\mathcal{A}$ and $B$ is the collection of
    witnesses of $\mathcal{B}$, the collection of witnesses of $\mathcal{B} \wedge \mathcal{A}$ can
    be represented by type $A \times B$ which is inhabited, as I can form at least one pair of them.
