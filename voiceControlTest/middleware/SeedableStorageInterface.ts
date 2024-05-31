export default interface SeedableStorageInterface {
    // this file wasn't in the sourcemap unfortunately, we can only speculate what it is

    seeded: any;
    setItem: (key: string, value: string) => any;
    getItem: (key: string) => string | null;
    clear: () => any;
}