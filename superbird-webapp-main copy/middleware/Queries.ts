import { PresetNumber } from 'store/PresetsDataStore';
import compress from 'graphql-query-compress';
import { HomeGraphOverridesReq } from 'store/HomeItemsStore';

export const getPresetsQuery = (serial: string) =>
  compress(`
query {
  presets(serial:"${serial}") {
    ... on Presets {
      presets {
        context_uri: contextUri
        name
        slot_index: slotIndex
        description
        image_url: imageUrl
      }
    }
    ... on PresetsError {
      message
    }
  }
}
`);

type SetPresetArgs = {
  serial: string;
  contextUri: string;
  slotIndex: PresetNumber;
};
export const setPresetsMutation = ({
  serial,
  contextUri,
  slotIndex,
}: SetPresetArgs) =>
  compress(`
mutation {
  setPreset(input:{
    slotIndex: ${slotIndex},
    contextUri: "${contextUri}"
    source: "tactile"
    serial: "${serial}"
    version: 1
    
  }) {
    ... on Presets {
      presets {
        contextUri: context_uri
        name
        slotIndex: slot_index
        description
        imageUrl: image_url
      }
    }
  }
}
`);

export const getTipsOnDemandQuery = compress(`
query {
  tipsOnDemand {
    ...on Tips {
      tips {
        id
        title
        description
      }
    }
    ...on TipsError {
      message
    }
  }
}`);

export const getShelfQuery = (
  limit: number,
  overrides: HomeGraphOverridesReq[],
) => {
  const overridesToString =
    overrides.length > 0
      ? `[${overrides.map(
          (override) => `{ id: "${override.id}", limit: ${override.limit} }`,
        )}]`
      : '[]';
  return compress(`
query {
  shelf(limit:${limit} overrides: ${overridesToString}) {
    ...on Shelf { 
      items { 
        title
        id 
        total
        children { 
            uri 
            title 
            subtitle 
            image_id: imageId 
            } 
          } 
        }
    ...on ShelfError { 
      message
    }
  }
}`);
};

export const getShelfSectionQuery = (
  id: string,
  limit: number,
  offset: number,
) =>
  compress(`
query {
  section(id: "${id}", limit:${limit}, offset:${offset}) { 
  ... on ShelfSection { 
      id, 
      title, 
      children { 
          uri, 
          title, 
          subtitle, 
          image_id: imageId
          }, 
      total 
      } 
  ... on SectionError { 
      message
    }
  }
}`);
