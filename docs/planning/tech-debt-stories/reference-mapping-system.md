# Reference Mapping System

**Type:** tech-debt story · **Written:** 2026-09-28 by Nathan · **Ready for:** further grooming

## Goal

Instead of referencing between wiki/testplan/code being purely a system of knowing what strings of text to grep for, we could implement a system that has better auto-maintenance. I'm envisioning a decorator factory that enables decorator ids above the test cases (as opposed to the id being in the test case name), and it may also be useful to design a system that can also be used for mapping code back to the wiki, and between the wiki and test plan. I'm not clear however, how decorator mapping works on the markdown side, and perhaps decorators aren't actually the best solution. We need to discuss and groom this story more before it can be implemented.

It's not a goal yet but the idea is that if Cicada ever has a built in UI wiki system, that the mappings can be used to show relevant test plans or code implmentations when you are looking at a wiki section. But that expanded role is pretty far down the road map if it ever happens. The primary goal is to make reference management as easy as possible to maintain and pull ids out of where they don't quite belong (specifically, it is prefferred to take ids out of the automation test case titles)

The result of a grooming session should decide a scope (Just test-case mapping vs wider uses that bring in wiki and/or more code) and implementation specifics that can be worked on and closed out. And create a new story for deferred decisions and questions

## Decisions

## Work, in batches

## Code map

## Acceptance

## Handoff

