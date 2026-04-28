## Report on agent usage

All of the code in this application was developed using Agents utilising the bmad method. This also includeded the documentation, testing, dockerisation etc.

After having a rough idea in my head of what to design, after my [note-player](https://github.com/Ademsk1/note-play) and also working with bmad prior in the [bmad-tutorial](https://github.com/Ademsk1/bmad-tutorial) I set about working on something involving quite a mathsy problem, namely working 3js - involving both the details of effects and styling with the rigor of mathematics - and the noisey signal of the microphone.

As a greenfield project (I wasn't up for changing note-player), developing a PRD was number 1. It was important to stipulate clearly the technical aspects early on. I've missed that before and it ended up using the context of a previous framework for solving new problems (even with new agents). However, I was very lax on describing the UX with bmad-ux-design. I figured that could be quite flexibily modified (and I was right).

Using the flow described in the BMAD docs, and scaffolding the project, I had a very not-working project on my hands. However, I found that retaining the same context window while resolving the issues fixed it remarkably quickly - more so than I was used to.

quick issues were resolving by bmad-quick-dev. Testing and evaluation was done infrequently in the early stages. It was only until I could see nodes being created through sound that I started considering them. It was fairly effective - and again, I didn't have the urge to change the context window so much - it was getting all the issues resolved promptly. Only a few times did I create a new window to start again.

To prepare for this, a few weeks back I had done some work on the microphone frequency analysis, and so felt ready to step in to help the agents. I thought it would be interesting to see its take on something like this. However, that really wasn't necessary. Immediately they had used a fairly simple algorithm to detect peak notes and display them in (a rather unusual choice) the golden ratio. I quite liked the nature of it, it felt less rigid than equal angles between notes.

### Test Generation

Throughout later stages, where maths was being used a lot more, I asked for further testing on the logic behind it. It seemed quite naturally taken to testing already, and without much prompting had generated a few already. However, it didn't really feel like it did them for the sake of testing - rather - something just **happened** in its thinking at times that made it think - ah I should test this!

So instead, I wrote another epic with it, outlining some WCAG and also testing that should be taken up. This seems to have properly focused it on the testing.

In the end, humans were quite important (HITL I guess) because several times it would have happily gone on without a care in the world if the app wasn't even working. It's very much not concerned with what **we** see. It doesn't know what the right glow is for a node. Even with Playwright and visual analysis, without that being specified in the docs, it might look at an overly bright node and think - yup thats fine.

Effectively, humans are important because the specification will never be perfect for the LLM - even with all the above taken care of.
