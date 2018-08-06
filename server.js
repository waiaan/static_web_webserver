const fs=require("fs");
const path=require("path");
const http = require("http");
const ejs = require("ejs");
const config = {
	port:1111
}
let root = "";

const getFileExt = (fileName) => {
	let arr = fileName.split(".");
	return arr[arr.length - 1];
}

const isFile = (path) => {
	return fs.existsSync(path)&&fs.statSync(path).isFile();
}

if (process.argv[2]) {
	// 处理路径含有空格的情况
	let n = 2;
	while (process.argv[n]) {
		root += process.argv[n];
		n++;
		if (process.argv[n]) {
			root += " ";
		}
	}
	root.replace(/\s*$/img, "");
} else {
	root = __dirname;
}

const router = (req, res) => {
	if (req.url ==="/favicon.ico") {
		return;
	}
	if (req.url === "/") {
		// 存在index.htm或者index.html时默认展示
		let arr = fs.readdirSync(root);
		if (arr.indexOf("index.htm")>0) {
			let reqPath = path.join(root, "index.htm");
			if (reqPath.indexOf('?') > 0) {
				reqPath = reqPath.split('?')[0];
			}
			reqPath = decodeURI(reqPath);
			return handleFile(reqPath, req, res);
		} else if (arr.indexOf("index.html") > 0) {
			let reqPath = path.join(root, "index.html");
			if (reqPath.indexOf('?') > 0) {
				reqPath = reqPath.split('?')[0];
			}
			reqPath = decodeURI(reqPath);
			return handleFile(reqPath, req, res);
		}
		
		return handleDir(root,req, res);
	}
	if (req.url !== "/") {
		// 真实的绝对地址
		let reqPath = path.join(root, req.url);
		if (reqPath.indexOf('?')>0) {
			reqPath = reqPath.split('?')[0];
		}
		reqPath = decodeURI(reqPath);
		if (isFile(reqPath)) {
			return handleFile(reqPath,req, res);
		} else {
			return handleDir(reqPath,req, res);
		}
	}
}

// handle different directories
const handleDir = (dir, req, res) => {
	let arr = fs.readdirSync(dir), datas = [];
	for (var i = 0; i < arr.length; i++){
		let filePath = path.join(dir, arr[i]);
		datas.push({ name: arr[i], isFile: isFile(path.resolve(dir, arr[i])), path: path.relative(root, filePath)});
	}
	let startInd = 0, dirs = [], relPath = path.relative(root, dir), endInd = relPath.indexOf('\\');
	while (endInd > 0) {
		dirs.push({ name: relPath.substring(startInd, endInd),path:"/"+relPath.substring(0, endInd).replace(/\\\\/ig,"/")});
		startInd = endInd+1;
		endInd = relPath.indexOf('\\', startInd);
	}
	dirs.push({ name: relPath.substring(startInd), path: "/" + relPath.replace(/\\\\/ig, "/") });
	const data=fs.readFileSync("./index.ejs").toString();
	const html = ejs.render(data, {folders:dirs, datas: datas });
	res.writeHead(200, { "Content-Type": "text/html;charset=UTF-8" });
	res.end(html);
}

// handle different files
const handleFile = (file, req, res) => {
	const fileType = getFileExt(file);
	let mimeType = '';
	switch (fileType) {
		case 'css':
			mimeType='text/css';
			break;
		case 'jpg':
			mimeType = 'image/jpeg';
			break;
		case 'js':
			mimeType = 'application/x-javascript';
			break;
		case 'jpg':
			mimeType = 'image/jpeg';
			break;
		case 'png':
			mimeType = 'image/png';
			break;
		case 'gif':
			mimeType = 'image/gif';
			break;
	}
	const data = fs.readFileSync(file);
	res.writeHead(200, { "Content-Type": mimeType })
	res.end(data);
}

const server = http.createServer(router).listen(config.port, (err) => {
	if (err) {
		throw new Error(err);
	}
	console.log("Server is running on port " + config.port);
});