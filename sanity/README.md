# Discrete Arts portfolio import

The archive contains the six concept galleries and two partner profiles from the website preview. It carries the original gallery order, photo captions, project descriptions, categories and ongoing or completed status. Each existing gallery keeps its website slug. Partner credits start empty because the preview has no assignments.

## Developer setup

1. Use the studio's single Sanity project and its chosen dataset. In its Sanity Studio configuration, import `schemaTypes` from the supplied `schemaTypes.js` and include the types in `schema.types`.
2. From this folder, sign in with the Sanity CLI under an account with import access. Substitute the actual project ID and dataset in the command below. The stable document IDs and `--missing` flag make repeat imports skip existing works and profiles.

   ```sh
   npx sanity@latest datasets import Discrete_Arts_Sanity_Import.tar.gz --project YOUR_PROJECT_ID --dataset production --missing
   ```

3. Open Portfolio work in Studio. Check Courtyard House has two images, then check The Terracotta Café has three. The first image of each work is its cover.
4. To enable website updates, connect the website's portfolio read path to published `portfolioWork` and `studioPartner` documents. Use `slug.current` for existing gallery URLs, dereference the assets for image URLs, and group works using `workStatus`, `sector` and partner references. Deploy Studio and invite the designer to its browser editor. The supplied website preview still reads its existing content source until this integration is made.

## Day-to-day editing

Open a work in Studio, change its photos, description or work status, and select **Publish**. For a new commission, create one Portfolio work entry and credit the relevant partners there.
