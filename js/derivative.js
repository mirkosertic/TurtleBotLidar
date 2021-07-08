function positionOverflowingValueFrom(pos, data, maxsize) {
  if (pos < 0) {
    pos += maxsize;
  } else if (pos >= maxsize) {
    pos -= maxsize;
  }
  return data[pos];
}

function derivativeOfInternal(data,maxsize,offset,i) {
  const leftPos = positionOverflowingValueFrom(i - offset, data, maxsize);
  const rightPos = positionOverflowingValueFrom(i + offset, data, maxsize);
  if (leftPos && rightPos) {
    return (rightPos - leftPos) / (offset + 1);
  }
  return undefined;
}

function derivativeOf(data,maxsize,offset) {
  const result = []
  for (let i = 0; i < maxsize; i++) {
      // https://web.media.mit.edu/~crtaylor/calculator.html
      /*const s1 = positionOverflowingValueFrom(i - 3, data, maxsize);
      const s2 = positionOverflowingValueFrom(i - 2, data, maxsize);
      const s3 = positionOverflowingValueFrom(i - 1, data, maxsize);
      const s4 = positionOverflowingValueFrom(i + 1, data, maxsize);
      const s5 = positionOverflowingValueFrom(i + 2, data, maxsize);
      const s6 = positionOverflowingValueFrom(i + 3, data, maxsize);
      if (s1 && s2 && s3 && s4 && s4 && s6) {
        result[i] = (-s1 + 9 * s2 - 45 * s3 + 45 * s4 - 9 * s5 + s6) / 60;
      } else {
        result[i] = undefined;
      }*/

    let sum = undefined;
    let samples = 0;
    for (let j = offset; j >= 1; j--) {
      const res = derivativeOfInternal(data, maxsize, j, i);
      if (res) {
        if (sum) {
          sum += res;
        } else {
          sum = res;
        }
        samples++;
      }
    }
    if (sum) {
      result[i] = sum / samples;
    } else {
      result[i] = undefined;
    }
  }
  return result;
}

export {derivativeOf, positionOverflowingValueFrom};
