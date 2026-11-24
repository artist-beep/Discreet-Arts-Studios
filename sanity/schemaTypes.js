const required = (rule) => rule.required();

export const schemaTypes = [
  {
    name: "portfolioWork",
    title: "Portfolio work",
    type: "document",
    fields: [
      {
        name: "name",
        title: "Work name",
        type: "string",
        validation: required,
      },
      {
        name: "slug",
        title: "Website address",
        type: "slug",
        options: { source: "name" },
        validation: required,
      },
      {
        name: "sector",
        title: "Category",
        type: "string",
        options: { list: ["Residential", "Commercial"], layout: "radio" },
        validation: required,
      },
      {
        name: "workStatus",
        title: "Work status",
        type: "string",
        options: {
          list: ["Unassigned", "Ongoing", "Completed"],
          layout: "radio",
        },
        initialValue: "Ongoing",
        validation: required,
      },
      { name: "projectType", title: "Type of work", type: "string" },
      { name: "description", title: "Description", type: "text", rows: 3 },
      {
        name: "images",
        title: "Gallery",
        description:
          "The first photo is the cover. Drag photos to change their order.",
        type: "array",
        of: [
          {
            type: "image",
            fields: [
              {
                name: "alt",
                title: "Photo caption and accessible description",
                type: "string",
              },
            ],
          },
        ],
        validation: (rule) => rule.required().min(1),
      },
      {
        name: "partners",
        title: "Credited partners",
        type: "array",
        of: [{ type: "reference", to: [{ type: "studioPartner" }] }],
        validation: (rule) => rule.unique(),
      },
      {
        name: "aspect",
        title: "Cover shape",
        type: "string",
        options: {
          list: [
            { title: "Portrait", value: "4/5" },
            { title: "Landscape", value: "5/4" },
          ],
        },
        initialValue: "4/5",
      },
      { name: "sortOrder", title: "Display order", type: "number" },
    ],
    preview: {
      select: { title: "name", subtitle: "workStatus", media: "images.0" },
    },
  },
  {
    name: "studioPartner",
    title: "Partner",
    type: "document",
    fields: [
      { name: "name", title: "Name", type: "string", validation: required },
      { name: "role", title: "Role", type: "string" },
      { name: "bio", title: "Bio", type: "text", rows: 3 },
      { name: "sortOrder", title: "Display order", type: "number" },
    ],
    preview: { select: { title: "name", subtitle: "role" } },
  },
];
