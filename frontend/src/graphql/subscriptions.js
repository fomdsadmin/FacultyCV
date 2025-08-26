export const GOTENBERG_GENERATION_STATUS_UPDATE = `
    subscription GotenbergGenerationStatusUpdate($key: String!) {
        gotenbergGenerationStatusUpdate(key: $key) {
            key
        }
    }
`;