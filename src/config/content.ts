/**
 * Marketing copy shared across public pages.
 *
 * Kept as data so an admin can later edit it from /app/settings without a
 * deploy, and so the same wording stays consistent everywhere it appears.
 */

export const processSteps = [
  {
    title: "Tell us about the property",
    description:
      "Answer a short set of questions about the home, its condition, and your situation. It takes about two minutes and there is nothing you have to answer.",
  },
  {
    title: "Speak with a local specialist",
    description:
      "Someone who works in your area calls at a time you choose. It is a conversation, not a pitch, and you can end it whenever you like.",
  },
  {
    title: "Review your options together",
    description:
      "We walk through what we see, what we may be able to do, and the other routes open to you — including the ones that do not involve us.",
  },
  {
    title: "Choose your next step",
    description:
      "If something we discuss makes sense for you, we move at your pace. If it does not, that is a perfectly good outcome and we leave it there.",
  },
] as const;

export const homeownerSituations = [
  {
    title: "Inherited a property",
    description:
      "A home you did not plan for, often shared with family and some distance away.",
  },
  {
    title: "Repairs or deferred maintenance",
    description:
      "Work has stacked up and the cost or the coordination has become the obstacle.",
  },
  {
    title: "Tired of being a landlord",
    description: "Turnovers, repairs, and late rent have stopped being worth it.",
  },
  {
    title: "Relocating",
    description: "A move, a new job, or family somewhere else has set the timeline.",
  },
  {
    title: "Divorce or a life transition",
    description: "Circumstances changed and the house needs to be resolved.",
  },
  {
    title: "Behind on payments or an urgent timeline",
    description:
      "Something needs to happen soon. We will be straightforward with you about what is and is not realistic.",
  },
  {
    title: "The home is vacant",
    description: "Carrying an empty property is expensive and quietly stressful.",
  },
] as const;

export const differentiators = [
  {
    title: "Local to Metro Detroit",
    description:
      "We work these neighbourhoods specifically, so the conversation is about your street and not a national average.",
  },
  {
    title: "Any condition considered",
    description:
      "You do not need to clean, stage, repair, or empty the house before talking to us.",
  },
  {
    title: "No obligation, ever",
    description:
      "Filling in the form starts a conversation. It does not commit you to anything, and it does not guarantee an offer.",
  },
  {
    title: "Straight answers",
    description:
      "If listing with an agent would serve you better, we will say so. We would rather be useful than pushy.",
  },
] as const;

/**
 * DEMO CONTENT — not real customer statements.
 *
 * These are clearly labelled as illustrative in the UI and must be replaced
 * with genuine, permissioned testimonials (or removed entirely) before
 * launch. See LAUNCH_CHECKLIST.md.
 */
export const demoTestimonials = [
  {
    quote:
      "They were the only ones who explained what my other options were before talking about their own. That is why I kept the conversation going.",
    attribution: "Illustrative example — Royal Oak",
  },
  {
    quote:
      "I inherited my aunt's house two states away from where I live. Having one local person to talk to made the whole thing manageable.",
    attribution: "Illustrative example — Warren",
  },
  {
    quote:
      "No pressure, no hard sell. They told me plainly what they could and could not do, and I decided from there.",
    attribution: "Illustrative example — Ferndale",
  },
] as const;

export const faqs = [
  {
    question: "Is there any cost or obligation?",
    answer:
      "No. Sharing details about your property and speaking with us is free, and nothing about it obligates you to sell. You can stop at any point.",
  },
  {
    question: "Will I definitely get an offer?",
    answer:
      "No, and we will not pretend otherwise. Whether we can put something in front of you depends on the property, the numbers, and your situation. Some conversations end with us pointing you somewhere else.",
  },
  {
    question: "Do I need to make repairs or clean first?",
    answer:
      "No. We look at homes in the condition they are in, including ones that need significant work. You do not need to prepare anything.",
  },
  {
    question: "How quickly can this move?",
    answer:
      "Timelines vary by property, title, and your own preferences. We will give you a realistic picture once we have talked, rather than a number up front that we cannot stand behind.",
  },
  {
    question: "What happens to my information?",
    answer:
      "It goes to our internal team so we can prepare for your conversation. We do not sell your personal information. Our Privacy Policy sets out how we handle it and how you can ask us to delete it.",
  },
  {
    question: "Who exactly am I dealing with?",
    answer:
      "Home Sweet Home is a real-estate investment and home-buying solutions business. We are not a brokerage, a lender, a law firm, or a housing counselling agency, and we do not give legal or financial advice.",
  },
  {
    question: "What areas do you work in?",
    answer:
      "Royal Oak and the surrounding Metro Detroit communities across Oakland, Macomb, and Wayne counties. If you are just outside, it is still worth asking.",
  },
] as const;

export const trustStatements = [
  "No obligation to talk",
  "Local, respectful support",
  "Any condition considered",
] as const;
