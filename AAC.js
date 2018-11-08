// adaptive arithmetic codec https://www.cnblogs.com/xubenben/p/3426646.html
const code_bit = 16
const top = (1 << code_bit) - 1
const qtr = ((top / 4) >> 0) + 1
const half = qtr * 2
const qtr3 = qtr * 3
const num = 256
const eof = num + 1

function encoder() {
  let high = top,
    low = 0,
    follow = 0,
    buffer = 0,
    capacity = 8
  const code = []
  const freq = new Uint32Array(num + 2).fill(1)
  freq[0] = 0
  const cum = new Uint32Array(num + 2)
  for (let i = num + 1; i > 0; i--) {
    cum[i - 1] = cum[i] + freq[i]
  }
  const outputBit = bit => {
    buffer >>= 1
    if (bit) buffer |= 0x80
    capacity -= 1
    if (capacity === 0) {
      code.push(buffer)
      capacity = 8
    }
  }
  const outputLast = () => {
    code.push(buffer >> capacity)
  }
  const output = bit => {
    outputBit(bit)
    while (follow > 0) {
      outputBit(bit ^ 1)
      follow--
    }
  }
  const encodeFinish = () => {
    encodeSymbol(eof)
    follow += 1
    if (low < qtr) output(0)
    else output(1)
    outputLast()
  }

  const encodeSymbol = symbol => {
    let range = high - low + 1
    high = (low + (range * cum[symbol - 1]) / cum[0] - 1) >>> 0
    low = (low + (range * cum[symbol]) / cum[0]) >>> 0
    for (;;) {
      if (high < half) {
        output(0)
      } else if (low >= half) {
        output(1)
        low -= half
        high -= half
      } else if (low >= qtr && high < qtr3) {
        follow++
        low -= qtr
        high -= qtr
      } else break
      low = 2 * low
      high = 2 * high + 1
    }
    for (let i = 0; i < symbol; ++i) cum[i]++
  }
  return {
    encodeSymbol,
    encodeFinish,
    code
  }
}

// decode
function decoder(code) {
  let high = top,
    low = 0,
    buffer = 0,
    capacity = 0,
    decode_index = 0,
    garbage_bits = 0
  const freq = new Uint32Array(num + 2).fill(1)
  freq[0] = 0
  const cum = new Uint32Array(num + 2)
  for (let i = num + 1; i > 0; i--) {
    cum[i - 1] = cum[i] + freq[i]
  }
  const readBit = () => {
    if (capacity === 0) {
      buffer = code[decode_index++]
      if (decode_index > code.length - 1) {
        garbage_bits += 1
        if (garbage_bits > code_bit - 2) {
          throw ''
        }
      }
      capacity = 8
    }
    const t = buffer & 1
    buffer >>= 1
    capacity -= 1
    return t
  }

  let value = 0
  for (let i = 0; i < code_bit; i++) {
    value = 2 * value + readBit()
  }

  const decodeSymbol = () => {
    let symbol
    const range = high - low + 1
    const t = (((value - low + 1) * cum[0] - 1) / range) >>> 0
    for (symbol = 1; cum[symbol] > t; symbol++) {}
    high = (low + (range * cum[symbol - 1]) / cum[0] - 1) >>> 0
    low = (low + (range * cum[symbol]) / cum[0]) >>> 0
    for (;;) {
      if (high < half) {
      } else if (low >= half) {
        value -= half
        low -= half
        high -= half
      } else if (low >= qtr && high < qtr3) {
        value -= qtr
        low -= qtr
        high -= qtr
      } else break
      low = 2 * low
      high = 2 * high + 1
      value = 2 * value + readBit()
    }
    for (let i = 0; i < symbol; ++i) cum[i]++
    return symbol
  }
  return {
    decodeSymbol,
    eof
  }
}

module.exports = {
  encoder,
  decoder
}
