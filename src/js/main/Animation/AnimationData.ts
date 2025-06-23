// Types
export interface EasingFunction {
  (x: number): number;
}

export interface EasingData {
  category: string;
  type: string;
  description: string;
}

export interface EasingItem {
  name: string;
  func: EasingFunction;
  category: string;
  type: string;
  description: string;
}

// Easing Functions Library
export const easingFunctions: Record<string, EasingFunction> = {
  linear: (x: number) => x,

  easeInQuad: (x: number) => x * x,
  easeOutQuad: (x: number) => 1 - (1 - x) * (1 - x),
  easeInOutQuad: (x: number) =>
    x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2,

  easeInCubic: (x: number) => x * x * x,
  easeOutCubic: (x: number) => 1 - Math.pow(1 - x, 3),
  easeInOutCubic: (x: number) =>
    x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,

  easeInQuart: (x: number) => x * x * x * x,
  easeOutQuart: (x: number) => 1 - Math.pow(1 - x, 4),
  easeInOutQuart: (x: number) =>
    x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2,

  easeInQuint: (x: number) => x * x * x * x * x,
  easeOutQuint: (x: number) => 1 - Math.pow(1 - x, 5),
  easeInOutQuint: (x: number) =>
    x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2,

  easeInSine: (x: number) => 1 - Math.cos((x * Math.PI) / 2),
  easeOutSine: (x: number) => Math.sin((x * Math.PI) / 2),
  easeInOutSine: (x: number) => -(Math.cos(Math.PI * x) - 1) / 2,

  easeInExpo: (x: number) => (x === 0 ? 0 : Math.pow(2, 10 * (x - 1))),
  easeOutExpo: (x: number) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  easeInOutExpo: (x: number) => {
    if (x === 0) return 0;
    if (x === 1) return 1;
    return x < 0.5
      ? Math.pow(2, 20 * x - 10) / 2
      : (2 - Math.pow(2, -20 * x + 10)) / 2;
  },

  easeInCirc: (x: number) => 1 - Math.sqrt(1 - Math.pow(x, 2)),
  easeOutCirc: (x: number) => Math.sqrt(1 - Math.pow(x - 1, 2)),
  easeInOutCirc: (x: number) =>
    x < 0.5
      ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
      : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2,

  easeInBack: (x: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * x * x * x - c1 * x * x;
  },
  easeOutBack: (x: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  },
  easeInOutBack: (x: number) => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return x < 0.5
      ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
      : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
  },

  easeInElastic: (x: number) => {
    const c4 = (2 * Math.PI) / 3;
    if (x === 0) return 0;
    if (x === 1) return 1;
    return -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c4);
  },
  easeOutElastic: (x: number) => {
    const c4 = (2 * Math.PI) / 3;
    if (x === 0) return 0;
    if (x === 1) return 1;
    return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
  },
  easeInOutElastic: (x: number) => {
    const c5 = (2 * Math.PI) / 4.5;
    if (x === 0) return 0;
    if (x === 1) return 1;
    return x < 0.5
      ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1;
  },

  easeInBounce: (x: number) => 1 - easingFunctions.easeOutBounce(1 - x),
  easeOutBounce: (x: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (x < 1 / d1) {
      return n1 * x * x;
    } else if (x < 2 / d1) {
      return n1 * (x -= 1.5 / d1) * x + 0.75;
    } else if (x < 2.5 / d1) {
      return n1 * (x -= 2.25 / d1) * x + 0.9375;
    } else {
      return n1 * (x -= 2.625 / d1) * x + 0.984375;
    }
  },
  easeInOutBounce: (x: number) =>
    x < 0.5
      ? (1 - easingFunctions.easeOutBounce(1 - 2 * x)) / 2
      : (1 + easingFunctions.easeOutBounce(2 * x - 1)) / 2,
};

// Easing data with categories and descriptions
export const easingData: Record<string, EasingData> = {
  linear: {
    category: 'linear',
    type: 'LINEAR',
    description: 'Constant speed throughout',
  },

  easeInQuad: {
    category: 'quad',
    type: 'QUAD',
    description: 'Slow start, accelerating',
  },
  easeOutQuad: {
    category: 'quad',
    type: 'QUAD',
    description: 'Fast start, decelerating',
  },
  easeInOutQuad: {
    category: 'quad',
    type: 'QUAD',
    description: 'Slow start and end',
  },

  easeInCubic: {
    category: 'cubic',
    type: 'CUBIC',
    description: 'Gradual acceleration',
  },
  easeOutCubic: {
    category: 'cubic',
    type: 'CUBIC',
    description: 'Gradual deceleration',
  },
  easeInOutCubic: {
    category: 'cubic',
    type: 'CUBIC',
    description: 'Smooth acceleration and deceleration',
  },

  easeInQuart: {
    category: 'quart',
    type: 'QUART',
    description: 'Strong acceleration',
  },
  easeOutQuart: {
    category: 'quart',
    type: 'QUART',
    description: 'Strong deceleration',
  },
  easeInOutQuart: {
    category: 'quart',
    type: 'QUART',
    description: 'Strong ease in and out',
  },

  easeInQuint: {
    category: 'quint',
    type: 'QUINT',
    description: 'Very strong acceleration',
  },
  easeOutQuint: {
    category: 'quint',
    type: 'QUINT',
    description: 'Very strong deceleration',
  },
  easeInOutQuint: {
    category: 'quint',
    type: 'QUINT',
    description: 'Very strong ease in and out',
  },

  easeInSine: {
    category: 'sine',
    type: 'SINE',
    description: 'Gentle acceleration',
  },
  easeOutSine: {
    category: 'sine',
    type: 'SINE',
    description: 'Gentle deceleration',
  },
  easeInOutSine: {
    category: 'sine',
    type: 'SINE',
    description: 'Very gentle ease in and out',
  },

  easeInExpo: {
    category: 'expo',
    type: 'EXPO',
    description: 'Exponential acceleration',
  },
  easeOutExpo: {
    category: 'expo',
    type: 'EXPO',
    description: 'Exponential deceleration',
  },
  easeInOutExpo: {
    category: 'expo',
    type: 'EXPO',
    description: 'Exponential ease in and out',
  },

  easeInCirc: {
    category: 'circ',
    type: 'CIRC',
    description: 'Circular acceleration',
  },
  easeOutCirc: {
    category: 'circ',
    type: 'CIRC',
    description: 'Circular deceleration',
  },
  easeInOutCirc: {
    category: 'circ',
    type: 'CIRC',
    description: 'Circular ease in and out',
  },

  easeInBack: {
    category: 'back',
    type: 'BACK',
    description: 'Backs up before moving forward',
  },
  easeOutBack: {
    category: 'back',
    type: 'BACK',
    description: 'Overshoots then settles',
  },
  easeInOutBack: {
    category: 'back',
    type: 'BACK',
    description: 'Backs up and overshoots',
  },

  easeInElastic: {
    category: 'elastic',
    type: 'ELASTIC',
    description: 'Elastic wind-up effect',
  },
  easeOutElastic: {
    category: 'elastic',
    type: 'ELASTIC',
    description: 'Elastic spring-back effect',
  },
  easeInOutElastic: {
    category: 'elastic',
    type: 'ELASTIC',
    description: 'Elastic wind-up and spring-back',
  },

  easeInBounce: {
    category: 'bounce',
    type: 'BOUNCE',
    description: 'Bouncing acceleration',
  },
  easeOutBounce: {
    category: 'bounce',
    type: 'BOUNCE',
    description: 'Bouncing deceleration',
  },
  easeInOutBounce: {
    category: 'bounce',
    type: 'BOUNCE',
    description: 'Bouncing ease in and out',
  },
};

// Categories for filtering
export const categories: string[] = [
  'all',
  'quad',
  'cubic',
  'quart',
  'quint',
  'sine',
  'expo',
  'circ',
  'back',
  'elastic',
  'bounce',
];
