
export const randomRgba = () => [Math.random(), Math.random(), Math.random(), Math.random()];

export const randomRange = (min: number, max: number): number => Math.random() * (max - min) + min;

/**
 * 计算法向量
 * Reference: 
 *  - https://bbs.csdn.net/topics/220016062
 *  - https://blog.csdn.net/zhw_giser/article/details/11950307
 *  - https://site.douban.com/129642/widget/forum/5265331/discussion/43006233/
 */
export const calculateNormal = (v0: Array<number>, v1: Array<number>, v2: Array<number>) => {
  let va = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]]; // v1 -> v0 的向量
  let vb = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]]; // v2 -> v0 的向量
  let n  = [
    va[1] * vb[2] - va[2] * vb[1],
    va[2] * vb[0] - va[0] * vb[2],
    va[0] * vb[1] - va[1] * vb[0]
  ];
  return n;
};

export const normalize = (v: Array<number>) => {
  let distance = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  return distance > 0.000001 ? [v[0] / distance, v[1] / distance, v[2] / distance] : [0, 0, 0];
};
