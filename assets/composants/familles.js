export const children = {frontWing:['mainplane','flaps','endplates'], wheels:['tyres','rims','brakes'], floor:['fences','diffuserRamp'], diffuser:['diffuserRamp'], rearWing:['beamWing','drs']};
export async function triangles(code) {
  const bytes = Uint8Array.from(atob(code), s=>s.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
