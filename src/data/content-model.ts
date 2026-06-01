import { z } from "astro/zod";

const text = z.string().min(1);
const textArray = z.array(text).min(1);
const dateLike = z.union([text, z.number(), z.date()]);
const numberOrText = z.union([z.number(), text]);
const nullableText = text.nullable();
const email = z.email();

const strictObject = <Shape extends z.ZodRawShape>(shape: Shape) =>
  z.object(shape).strict();

export const authorFrontmatterSchema = strictObject({
  name: text,
  occupation: text,
  company: text,
  email,
  avatar: text.optional(),
  twitter: text.optional(),
  linkedin: text.optional(),
  github: text.optional()
});

export const blogFrontmatterSchema = strictObject({
  title: text,
  date: dateLike,
  category: z.literal("blog"),
  authors: textArray.default(["default"]),
  tags: textArray,
  summary: text
});

const socialSchema = strictObject({
  network: text,
  icon: text,
  url: text
});

const localizedTextSchema = strictObject({
  ita: text,
  eng: text
});

const cvBasicsSchema = strictObject({
  name: text,
  label: text,
  picture: text,
  phone: text,
  email,
  website: text,
  docs: strictObject({
    cv: text,
    thesis: text
  }),
  coverPageSummary: text,
  websiteSummary: text,
  officialDeptPage: text,
  shortBio: text,
  mur: strictObject({
    lessThan2000c: localizedTextSchema
  }),
  location: strictObject({
    address: text,
    shortAddress: text,
    postalCode: text,
    city: text,
    countryCode: text
  }),
  office: strictObject({
    department: text,
    addressShort: text,
    address: text,
    postalCode: numberOrText,
    city: text,
    geo: strictObject({
      lat: z.number(),
      long: z.number()
    })
  }),
  social: z.array(socialSchema).min(1)
});

const educationSchema = strictObject({
  startDate: dateLike,
  endDate: dateLike,
  institution: text,
  area: text,
  studyType: text,
  topic: text,
  department: text,
  dichiara: text
});

const languageSchema = strictObject({
  language: text,
  fluency: text
});

const citationMetricSchema = strictObject({
  citations: z.number(),
  hindex: z.number()
});

const researchSchema = strictObject({
  awards: z.array(
    strictObject({
      date: dateLike,
      summary: text,
      title: text,
      institution: text.optional(),
      intro: text.optional(),
      show: z.boolean().optional(),
      sommario: text.optional()
    })
  ),
  boards: z.array(
    strictObject({
      end: dateLike,
      name: text,
      publisher: text,
      role: text,
      section: text,
      start: dateLike,
      type: text
    })
  ),
  citations: strictObject({
    all: strictObject({
      citations: z.number(),
      highest: z.number(),
      hindex: z.number()
    }),
    date: dateLike,
    since2012: citationMetricSchema,
    since2014: citationMetricSchema,
    since2016: citationMetricSchema,
    since2020: citationMetricSchema,
    source: text
  }),
  committees: z.array(
    strictObject({
      address: text,
      date: dateLike,
      name: text,
      role: text,
      ruolo: text,
      year: z.number(),
      end: dateLike.optional(),
      h: z.boolean().optional()
    })
  ),
  currentGoals: strictObject({
    itemized: z.array(
      strictObject({
        area: text,
        keywords: textArray
      })
    ),
    short: text
  }),
  grants: z.array(
    strictObject({
      from: dateLike,
      institution: text,
      project: text,
      ruolo: text,
      tipologia: text,
      to: dateLike,
      type: text,
      funding: strictObject({
        amount: z.number(),
        unit: text
      }).optional(),
      haspdf: text.optional(),
      highlight: z.boolean().optional(),
      role: text.optional()
    })
  ),
  history: z.array(
    strictObject({
      achievements: textArray,
      description: text,
      from: dateLike,
      title: text,
      to: dateLike.optional()
    })
  ),
  impact: strictObject({
    scholar: strictObject({
      citations: z.number(),
      date: dateLike,
      hindex: z.number(),
      since: dateLike
    }),
    scopus: strictObject({
      citations: z.number(),
      date: dateLike,
      hindex: z.number(),
      npubs: z.number(),
      since: dateLike
    })
  }),
  mentorship: z.array(
    strictObject({
      institution: text,
      name: text,
      role: text
    })
  ),
  patents: z.array(
    strictObject({
      authors: textArray,
      date: dateLike,
      haspdf: text,
      link: text,
      number: text,
      title: text,
      type: text
    })
  ),
  peerReview: z.array(
    strictObject({
      date: dateLike,
      name: text,
      type: text,
      onpublons: z.boolean().optional()
    })
  ),
  phdStudents: z.array(
    strictObject({
      correlatori: z.union([text, textArray]),
      end: dateLike,
      init: dateLike,
      institution: text,
      name: text,
      relatore: text,
      role: text,
      ruolo: text,
      titolo: text
    })
  ),
  productivity: strictObject({
    books: z.number(),
    coauthors: z.number(),
    conferences: z.number(),
    journals: z.number(),
    patents: z.number(),
    total: z.number(),
    transactions: z.number()
  }),
  projectParticipations: z.array(
    strictObject({
      acronym: text,
      consortium: z.array(
        strictObject({
          name: text,
          country: text.optional()
        })
      ),
      dateEnd: dateLike,
      dateStart: dateLike,
      name: text,
      role: text,
      type: text,
      coordinator: text.optional(),
      haspdf: text.optional(),
      highlights: textArray.optional(),
      number: numberOrText.optional()
    })
  ),
  stages: z.array(
    strictObject({
      end: dateLike,
      hours: z.number(),
      init: dateLike,
      mand: z.boolean(),
      name: text,
      company: text.optional(),
      "company:Sfelab": nullableText.optional(),
      credits: z.number().optional(),
      "credits 10": z.null().optional()
    })
  ),
  students: z.array(
    strictObject({
      name: text,
      title: text,
      company: text.optional(),
      year: z.number().optional()
    })
  ),
  talks: z.array(
    strictObject({
      address: text,
      date: dateLike,
      name: text,
      role: text,
      ruolo: text,
      title: text,
      year: z.number(),
      ref: text.optional()
    })
  ),
  videos: z.array(
    strictObject({
      description: text,
      link: text,
      recordedOn: text,
      title: text,
      languages: textArray.optional()
    })
  )
});

const teachingCourseSchema = strictObject({
  aaEnd: z.number(),
  aaInit: z.number(),
  courseName: text,
  crediti: numberOrText,
  institution: text,
  level: text,
  ore: numberOrText,
  position: text,
  titolare: text,
  "co-titolare": text.optional(),
  haspdf: text.optional(),
  link: text.optional(),
  short: text.optional(),
  students: text.optional(),
  type: text.optional()
});

const workSchema = strictObject({
  current: strictObject({
    position: text,
    startDate: dateLike,
    company: text,
    address: text,
    posizione: text
  }),
  previous: z.array(
    strictObject({
      address: text,
      company: text,
      dichiara: text,
      highlights: textArray,
      index: z.number(),
      position: text,
      posizione: text,
      startDate: dateLike,
      endDate: dateLike.optional(),
      positionLong: text.optional()
    })
  ),
  other: strictObject({
    institutional: z.array(
      strictObject({
        address: text,
        dichiara: text,
        roleEn: text,
        roleIt: text,
        intervals: z.array(
          strictObject({
            end: dateLike,
            name: text,
            start: dateLike,
            haspdf: text.optional()
          })
        )
      })
    ),
    projects: z.array(
      strictObject({
        description: text,
        name: text,
        role: text,
        timeframe: text,
        type: text,
        where: text,
        link: text.optional()
      })
    ),
    recommendations: z.array(
      strictObject({
        email,
        institution: text,
        name: text,
        title: text,
        where: text
      })
    ),
    skills: z.array(
      strictObject({
        keywords: textArray,
        name: text
      })
    ),
    specializations: textArray
  })
});

export const publicCvSchema = strictObject({
  basics: cvBasicsSchema,
  education: z.array(educationSchema).min(1),
  languages: z.array(languageSchema).min(1),
  research: researchSchema,
  teaching: strictObject({
    courses: z.array(teachingCourseSchema).min(1),
    currentGoals: z.string()
  }),
  work: workSchema
});

const journalIdentifierSchema = strictObject({
  type: text,
  id: text
});

const publicationJournalSchema = strictObject({
  identifier: z.array(journalIdentifierSchema).optional(),
  name: text,
  id: text
});

export const bibliographySchema = strictObject({
  records: z
    .array(
      strictObject({
        authors: textArray,
        title: text,
        year: z.string().regex(/^\d{4}$/),
        justApplied: z.boolean(),
        justAccepted: z.boolean(),
        keyword: textArray,
        type: z.enum([
          "book",
          "bookchapter",
          "conference",
          "journal",
          "patent",
          "talk",
          "techreport",
          "thesis",
          "workshop"
        ]),
        timestamp: z.number(),
        address: text.optional(),
        booktitle: text.optional(),
        day: text.optional(),
        doi: text.optional(),
        institution: text.optional(),
        isbn: text.optional(),
        issn: text.optional(),
        journal: publicationJournalSchema.optional(),
        month: text.optional(),
        pages: text.optional(),
        patentNumber: text.optional(),
        publisher: text.optional(),
        reportNumber: text.optional(),
        url: text.optional(),
        volume: text.optional()
      })
    )
    .min(1),
  metadata: strictObject({})
});

export const thesesSchema = strictObject({
  theses: z
    .array(
      strictObject({
        __content: text,
        additional: textArray,
        image: nullableText,
        institution: text,
        institutionLogo: nullableText,
        level: text,
        maturity: text,
        maturityColor: z.enum(["green", "red", "yellow"]),
        prio: z.number(),
        skills: textArray,
        subtopic: text,
        title: text,
        topic: text,
        created: dateLike.optional(),
        imageData: text.optional(),
        support: text.optional(),
        where: text.optional()
      })
    )
    .min(1)
});

export const projectSchema = strictObject({
  title: text,
  description: text,
  imgSrc: text,
  href: text
});

export const projectsSchema = z.array(projectSchema).min(1);

export const markdownBodySchema = text;

export type PublicCv = z.infer<typeof publicCvSchema>;
export type Bibliography = z.infer<typeof bibliographySchema>;
export type ThesisCatalog = z.infer<typeof thesesSchema>;
export type BlogFrontmatter = z.infer<typeof blogFrontmatterSchema>;
export type AuthorFrontmatter = z.infer<typeof authorFrontmatterSchema>;
export type Project = z.infer<typeof projectSchema>;
