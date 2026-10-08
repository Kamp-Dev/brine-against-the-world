const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../web'),port=Number(process.env.PORT||8780);
const prefix='/brine-against-the-world/';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.mp4':'video/mp4'};
http.createServer((req,res)=>{
 let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);return res.end()}
 if(name==='/'){res.writeHead(302,{Location:prefix});return res.end()}
 if(!name.startsWith(prefix)){res.writeHead(404);return res.end()}
 let relative=name.slice(prefix.length);if(!relative||relative.endsWith('/'))relative+='index.html';
 const file=path.resolve(root,relative);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
 fs.stat(file,(error,stat)=>{if(error||!stat.isFile()){res.writeHead(404);return res.end()}
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','Content-Length':stat.size});fs.createReadStream(file).pipe(res)});
}).listen(port,'127.0.0.1',()=>console.log(`Playtest: http://127.0.0.1:${port}${prefix}`));
