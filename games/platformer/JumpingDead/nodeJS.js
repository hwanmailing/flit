// const http = require('http')
// const fs = require('fs') // file system

// const server = http.createServer((req, res) => {
//   res.writeHead(200, { 'content-type': 'text/html' })
//   fs.createReadStream('index.html').pipe(res)
// })

// // //app.use(express.static(`${__dirname}/assets`))
// // app.use(express.static(`${__dirname}/*`))
//  server.listen(process.env.PORT || 3000)

 var http = require('http');  
 var url = require('url');  
 var fs = require('fs');  

 var server = http.createServer(function(request, response) {  
     /* 
     서버에 클라이언트로 부터 페이지 요청이 오면 이 함수가 호출된다. 
     index.html안에 script scr=""등의 구문등을 만나면 해당 화일도 다 페이지 요청과 같이 여기 호출된다.
     따라서 필요한 화일마다 한번씩 여기 호출되는 것인다. index.html에 src=""등의 화일들이 있을때마다 여기 호출된다. 그대로 화일을 읽어서 response해주면 된다.
     response.write(data)로 화일 내용인 데이터가 보내진다.
      decodeURIComponent => %E1%84%85%E1%85%A1%E1 => 한글, encodeURIComponent => 한글 => %E1%84%85%E1%85%A1%E1
      */
     var path = decodeURIComponent(url.parse(request.url).pathname);  
     
     
     //console.log(decodeURIComponent(path)); 
     
     var nDotIndex  = path.lastIndexOf(".");
     var sExtension  = path.substring((nDotIndex + 1));
     fs.readFile(__dirname + path, function(error, data) {  
         if (error) {  
            response.writeHead(404);  
            response.write('This page does not exist');
            response.end();  
         } else {  
            //console.log(path);
            if (sExtension === 'html') 
              response.writeHead(200, {'Content-Type':'text/html; charset=utf-8'}); // charset=utf-8 를 안넣으면 한글이 깨진다.
            else if (sExtension === 'htm') 
            response.writeHead(200, {'Content-Type':'text/html; charset=utf-8'}); 
            else if (sExtension === 'css') 
              response.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' }); 
            else if (sExtension === 'js') 
              response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' }); 
            else if (sExtension === 'png') 
              response.writeHead(200, { 'Content-Type': 'image/png' }); 
            else if (sExtension === 'jpg') 
              response.writeHead(200, { 'Content-Type': 'image/jpg' }); 
            else if (sExtension === 'jpeg') 
              response.writeHead(200, { 'Content-Type': 'image/jpeg' }); 
            else  
              response.writeHead(200, {  'Content-Type': 'text/html; charset=utf-8' }); 
            response.write(data);  
            response.end();  
         }  
     }); 
 });  
 server.listen(3000);