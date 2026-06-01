---
category: blog
date: '2014-02-24'
summary: Template Haskell promises to be the next 'big thing' for parallel code generation. In this short blog post, I'll guide you through some very simple examples showing the power of Template Haskell.
tags : ["topics/haskell", "topics/digital topics/signal topics/processing"]
title: Towards template programming in Haskell
---

Template Haskell promises to be the next "big thing" for parallel code generation. It allows to algorithmically generate and manipulate Haskell programs, much like LISP macros. With *quasi-quotation*, it even allows to define other languages whose syntax can be manipulated.

In this short blog post, I'll guide you through some very simple examples showing the power of Template Haskell. Originally I struggled a lot in putting up a working example, so I hope this could be of help to anyone of you starting out on this.

# Pre-requirements

Before we start, you should have GHC (Haskell's compiler) and Cabal (Haskell's package manager) installed. This usually depends on your OS. Then you should install `template-haskell` with Cabal:

``` shell
cabal install template-haskell
```

# Initial example

Let's define a module with a function that computes the symbolic power of an expression whose **value is known only when the program is run**. The power exponent is, instead, known at compile-time[^1].

Let's call our module `A`. This module will import Template Haskell and define a function `expand_power`

``` haskell
module A where

import Language.Haskell.TH
import Language.Haskell.TH.Syntax

expand_power :: Int -> Q Exp -> Q Exp
expand_power n x =
  if n==0
    then [| 1 |]
    else [| $x * $(expand_power (n-1) x ) |]

mk_power :: Int -> Q Exp
mk_power n = [| \x -> $(expand_power n [| x |]) |]

```

The function `expand_power` receives an `int`, a **staged expression** `Q Exp` and returns another staged expression `Q Exp`. A staged expression is just a representation of a portion of code. It is like an *abstract syntax tree* that represents a computation to be performed at run-time. The above type means that the function receives a representation of a symbol and returns an expression of that symbol, without evaluating it.

The function builds, with a (compile-time) recursion, an expression tree. First of all, we are building an AST for a multiplication so the value returned is a quoted value. The dollar sign is the *splice* operator; `$x` allows to take the AST passed as parameter `x` and splice it into the bigger AST as the first operand of operator `*`. Splicing allows to evaluate at compile time expressions that will return an AST, so we can invoke recursively `expand_power` to provide the representation of the sub-expression.

The function `mk_power` generates a function by expanding at compile time $x^n$ given $n$.  To use `mk_power` and generate a program at *compile-time*, we have to write another module (due to the 'limitations' of the current implementation of template Haskell). This will be our `main.hs` program. It will use `mk_power` to instantiate a specialised power function:


```haskell

module Main where

import Language.Haskell.TH.Syntax
import Language.Haskell.TH.Ppr
import Language.Haskell.TH
import A
    
printCode :: Q Exp -> IO ()
printCode ast = runQ ast >>= putStrLn . pprint
    
main = printCode (mk_power 3) -- prints the actual syntax tree 
  
-- power3 = $(mk_power 3) -- or instantiate the function and call it 
-- main = power3 5
```

If you build and run the program:

```haskell
ghc --make -XTemplateHaskell main.hs -o main && ./main
\x_0 -> x_0 GHC.Num.* (x_0 GHC.Num.* (x_0 GHC.Num.* 1))
```

you get  the Haskell code for the generated function.

# Conclusions
Template Haskell opens a whole new world for the creation of embedded DSLs. In this example, we could have optimised `(x_0 GHC.Num.* 1)` to `x_0` programmatically but much more complex DSLs could apply domain specific optimisations to enhance or adapt the code at run-time.

[^1]: Taken from DSL 'Implementation in MetaOCaml, Template Haskell, and C++', (Czarnecki1 et al., 2003).
