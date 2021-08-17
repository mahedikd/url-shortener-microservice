const express = require('express');
const isUrl = require("is-valid-http-url");
const shortid = require('shortid');
const cors = require('cors');
const Database = require("@replit/database");

const db = new Database();
const app = express();
const PORT = process.env.PORT || 4000;
const {log} = console;

app.use(express.static('public'));
app.use(cors({optionsSuccessStatus: 200}));
app.use(express.urlencoded());


//
app.get('/',(req,res)=>{
	res.sendFile(__dirname+'/view/index.html');
	db.list().then(keys=>log('keys',keys));
})

// post route
app.post('/api/shorturl',(req,res)=>{
	const url = req.body.url;
	let result;
	let short_url;
	let original_url;

	if(isUrl(url)){
		original_url = url;
		short_url	= shortid.generate();
		result = {original_url,short_url}
	}else{
		res.json({ error: 'invalid url' });
		return
	}
	//set data to replit db
	db.set(short_url,result).then(()=>log(`Data added,Data key: ${short_url}`));

	res.json(result);
})

// redirect route
app.get('/api/shorturl/:shortid',(req,res)=>{
	const shorturl = req.params.shortid;

	if(shortid.isValid(shorturl)){
		// get data from replit 
		db.get(shorturl).then(value =>{
			if(value===null){
				res.json({ error: 'invalid url' });
			}else{
				res.redirect(value.original_url);
				log('redirected');
			}
		});
	}
})

//delete db data 
app.get('/api/delete',async(req,res)=>{
	const dbKeys = await db.list();

	for (let key of dbKeys){
		await db.delete(key)
	}
	
	db.list().then(keys=>log('remaining keys',keys));
	res.send('DB deleted');

})

// for page that does not exist
app.get('*',(req,res)=>{
	res.json({error:'resourse does not exist'});
})

app.listen(PORT,()=>log(`listening on port ${PORT}`));