export const isProviderActive = (provider) => {
    if (!provider) return false;
    if (provider.isActive === true) return true;
    return false;
};

export const activeProviderFilter = () => ({
    isActive: true
});
