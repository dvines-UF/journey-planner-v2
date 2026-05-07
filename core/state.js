export const state = {
  anchorCity: null,
  setAnchorCity(city) {
    this.anchorCity = city;
  },
  getAnchorCity() {
    return this.anchorCity;
  }
};
