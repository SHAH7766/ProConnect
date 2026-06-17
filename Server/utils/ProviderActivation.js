export const isProviderActive = (provider) => {
    if (!provider) return false;
    if (provider.isActive === true && provider.isBanned !== true) return true;
    return false;
};

export const activeProviderFilter = () => ({
    isActive: true,
    isBanned: { $ne: true }
});
