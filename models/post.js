var mongodb=require('./db');

markdown =require('markdown').markdown;

function Post(name,head,title,tags,post){
	this.name=name;
	this.head=head;
	this.title=title;
	this.tags=tags;
	this.post=post;
}

module.exports=Post;

Post.prototype.save = function(callback) {
	var date=new Date();

	var time={
		date:date,
		year:date.getFullYear(),
		month:date.getFullYear()+"-"+(date.getMonth()+1),
		day:date.getFullYear()+"-"+(date.getMonth()+1)+"-"+(date.getDate()),
		minute:date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+""+date.getHours()+":"+(date.getMinutes() < 10 ? ('0' +date.getMinutes()) : date.getMinutes())
	}
	// 要存入数据库的文件
	var post={
		name:this.name,
		head:this.head,
		time:time,
		title:this.title,
		tags:this.tags,
		post:this.post,
		comments:[],
		pv:0
	};
	
    //打开数据库
	mongodb.open(function(err,db){
		if (err) {
			return callback(err);//错误，返回错误信息
		}
		//读取posts集合
		db.collection('posts',function(err,collection){
			if (err) {
				mongodb.close();
				return callback(err);//错误，返回错误信息
			}
		//将用户数据插入posts集合
		collection.insert(post,{
			safe:true
		},function(err){
			mongodb.close();
			if (err) {
				return callback(err);//错误，返回错误信息
			}
			callback(null);//成功，err为null，并返回存储后的用户文档。
		});
		});
	});
};

Post.getTen =function(name,page,callback){
	//打开数据库
	mongodb.open(function(err,db){
		if (err) {
			return callback(err);//错误，返回错误信息
		}
	//读取posts集合
	    db.collection('posts',function(err,collection){
			if (err) {
				mongodb.close();
				return callback(err);//错误，返回错误信息
			}
	    var query={};
	    if (name) {
	    	query.name=name;
	    }
	    collection.count(query,function(err,total){
	    	collection.find(query,{
	    		skip:(page-1)*10,
	    		limit:10
	    	}).sort({
	    		time:-1
	    	}).toArray(function(err,docs){
	    		mongodb.close();
	    		if (err) {
	    			return callback(err);
	    		}
	    		docs.forEach(function(doc){
	    			doc.post=markdown.toHTML(doc.post);
	    		});

	    		callback(null,docs,total);
	    	});
	    })      
	    });
	  	});
};


Post.getOne =function(name,day,title,callback){
	mongodb.open(function(err,db){
		if (err) {
			return callback(err);
		}
		db.collection('posts',function(err,collection){
			if (err) {
				mongodb.close();
				return callback(err);
			}
			collection.findOne({
				"name":name,
				"time.day":day,
				"title":title
			},function(err,doc){
				
				if (err) {
					mongodb.close();
					return callback(err);
				}
 
				if(doc){
					collection.update({
					    "name":name,
					    "time.day":day,
					    "title":title
					},{
						$inc:{"pv":1}
					},function(err){
						mongodb.close();
						if (err) {
							return callback(err);
						}
					});

					doc.post = markdown.toHTML(doc.post);
					doc.comments.forEach(function (comment){
						comment.content =markdown.toHTML(comment.content)
					});
					callback(null,doc);
				}
               
				
			});
		});
	});
};

//返回原始内容发表的内容
Post.edit=function(name,day,title,callback){
	mongodb.open(function(err,db){
		if (err) {
			return callback(err);
		}
		db.collection('posts',function(err,collection){
			if (err) {
				mongodb.close();
				return callback(err);
			}
			collection.findOne({
				"name":name,
				"time.day":day,
				"title":title
			},function(err,doc){
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null,doc);
			});
		});
	});
};

//更新文章
Post.update=function(name,day,title,post,callback){
	mongodb.open(function(err,db){
		if (err) {
			return callback(err);
		}
		db.collection('posts',function(err,collection){
		if (err) {
				mongodb.close();
				return callback(err);
			}
        collection.update({
			"name":name,
			"time.day":day,
			"title":title
		},{
			$set:{post:post}
		},function(err){
			mongodb.close();
			if (err) {
				return callback(err);
			}
			callback(null);
		});
		});
		
	});
};

//删除文章
Post.remove=function(name,day,title,callback){
	mongodb.open(function(err,db){
		if (err) {
			return callback(err);
		}
		db.collection('posts',function(err,collection){
		if (err) {
				mongodb.close();
				return callback(err);
			}
        collection.remove({
			"name":name,
			"time.day":day,
			"title":title
		},{
			W:1
		},function(err){
			mongodb.close();
			if (err) {
				return callback(err);
			}
			callback(null);
		});
		});
		
	});
};


//返回所有文章存储信息
Post.getArchive =function(callback){
	mongodb.open(function(err,db){
		if (err) {
			return callback(err);
		}
		db.collection('posts',function(err,collection){
			if (err) {
				mongodb.close();
				return callback(err);
			}

			collection.find({},{
				"name":1,
				"time":1,
				"title":1
			}).sort({
				time:-1
			}).toArray(function(err,docs){
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null,docs);
			});
		});
	});
};


//返回所有的标签
Post.getTags =function(callback){
	mongodb.open(function(err,db){
		if (err) {
			return callback(err);
		}
		db.collection('posts',function(err,collection){
			if (err) {
				mongodb.close();
				return collection(err);
			}
			collection.distinct("tags",function(err,docs){
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null,docs);
			});
		});
	});
};


//返回所有特定便签
Post.getTag =function(tag,callback){
	mongodb.open(function(err,db){
		if (err) {
			return callback(err);
		}
		db.collection('posts',function(err,collection){
			if (err) {
				mongodb.close();
				return collection(err);
			}
			collection.find({
				"tags":tag
			},{
				"name":1,
				"time":1,
				"title":1
			}).sort({
				time:-1
			}).toArray(function(err,docs){
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null,docs);
			});
			
		});
	});
};




Post.search =function(keyword,callback){
	mongodb.open(function(err,db){
		if (err) {
			return callback(err);
		}
		db.collection('posts',function(err,collection){
			if (err) {
				mongodb.close();
				return callback(err);
			}
			var pattern = new RegExp("^.*"+keyword+".*$","i");
			collection.find({
				"title":pattern
			},{
				"name":1,
				"time":1,
				"title":1
			}).sort({
				time:-1
			}).toArray(function(err,docs){
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null,docs);
			});
		});

	});
};