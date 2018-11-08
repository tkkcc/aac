const { encoder, decoder } = require('./AAC')
// encode
const e = encoder()
const data = [97, 98, 100, 100, 97, 200, 192, 97, 97, 100]
data.forEach(i => e.encodeSymbol(i))
e.encodeFinish()
// decode
const d = decoder(e.code)
const ans = []
while ((a = d.decodeSymbol()) !== d.eof) ans.push(a)
for (let i = 0; i < data.length; ++i) {
  if (data[i] !== ans[i]) console.log('error')
}