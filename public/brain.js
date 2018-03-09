var Neuroevolution = function (options) {
  const self = this;

  self.options = {
    activation: function (a) {
      ap = (-a) / 1;
      return (1 / (1 + Math.exp(ap)))
    },
    randomClamped: function () {
      return Math.random() * 2 - 1;
    },
  }
}
