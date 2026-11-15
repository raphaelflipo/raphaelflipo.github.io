import { createServer } from 'node:http';
import worker from '../src/worker.mjs';
const server=createServer(async(req,res)=>{
  const response=await worker.fetch(new Request('http://127.0.0.1:8787'+req.url,{method:req.method,headers:req.headers}),{});
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
});
server.listen(8787,'127.0.0.1',()=>console.log('Local preview: http://127.0.0.1:8787 (sales disabled)'));
