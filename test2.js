var TelegramBot = require('node-telegram-bot-api');
var Datastore = require('nedb');
var Q = require('q');
var books = new Datastore({filename:'books'});
var users = new Datastore({filename: 'users'});
var articles = new Datastore({filename:'articles'});
books.loadDatabase();
articles.loadDatabase();
users.loadDatabase();

var commands = {
	add 	: /\/add/i,
	find 	: /\/find/i,
	start 	: /\/start/i,
	help 	: /\/help/i,
	authors	: /\/authors/i,
	stats	: /\/stats/i,
	about	: /\/about/i,
	donate	: /\/donate/i,
	todo 	: /\/todo/i

};

var author_exp = /([a-zA-Z\u0430\u0431\u0432\u0433\u0434\u0435\u0451\u0436\u0437\u0438\u043A\u043B\u043C\u043D\u043E\u043F\u0440\u0441\u0442\u0443\u0444\u0445\u0446\u0447\u0448\u0449\u044D\u044C\u044B\u044A\u044E\u044F]\.)\s\S+(.)/i;
var url_exp = /((\w+:\/\/)[-a-zA-Z0-9:@;?&=\/%\+\.\*!'\(\),\$_\{\}\^~\[\]`#|]+)/i;
var commands_str = "/add – Добавить книгу или статью.\n"
				  +"/find – Поиск книг или статей.\n"
				  +"/help – Помощь.\n"
				  +"/authors – Список авторов.\n"
				  +"/stats – Статистика.\n"
				  +"/about – Информация.\n"
				  +"/todo – Планируемые нововведения.\n"
				  +"/donate – На кофе автору бота.";


var agreement = 'Дисклеймер еще не написан...';
var token = your.tokem;
var bot = new TelegramBot(token,{polling:true});

var add_user = function (query){
	var chat_id = query.chat_id;
	var username = query.username;
	var name = query.name;
	users.findOne({chat_id:chat_id},(err,doc)=>{
		if(doc === null){
			bot.sendMessage(chat_id,'Для получения читательского билета необходимо принять пользовательское соглашение:\n'+agreement,{
				reply_markup:{
					keyboard:[['Принять'],['Отказаться']]
				}
			})
			.then(
				bot.once('message',(msg)=>{
					var query = {
						chat_id		: msg.chat.id,
						text 		: msg.text,
						name 		: msg.chat.first_name+' '+msg.chat.last_name,
						username	: msg.chat.username
					};
					if(query.text === 'Принять'){
						bot.sendMessage(query.chat_id,'Поздравляем. Спасибо, что вы с нами. Чтобы увидеть список команд, отправьте /help .',{
							reply_markup:{
								hide_keyboard:true
							}
						});
						users.insert({chat_id:query.chat_id,username:query.username,name:query.name,agreement:true});
					}
					else{
						bot.sendMessage(query.chat_id,'Вы отказались принимать пользовательское соглашение. Если вы передумаете, отправьте команду /start .',{
							reply_markup:{
								hide_keyboard:true
							}
						});
						users.insert({chat_id:query.chat_id,username:query.username,name:query.name,agreement:false});
					}
				})
			);
		}
		else if(doc.agreement === false){
			bot.sendMessage(chat_id,'Вы уже обращались к нам, но отказались принять пользовательское соглашение. Прочтите его еще раз, оно не длинное:\n'+agreement,{
				reply_markup:{
					keyboard:[['Принять'],['Отказаться']]
				}
			}).then(
				bot.once('message',(msg)=>{
					var query = {
						chat_id		: msg.chat.id,
						text 		: msg.text,
						name 		: msg.chat.first_name+' '+msg.chat.last_name,
						username	: msg.chat.username
					};
					if(query.text === 'Принять'){
						bot.sendMessage(query.chat_id,'Поздравляем. Спасибо, что вы с нами. Чтобы увидеть список команд, отправьте /help .',{
							reply_markup:{
								hide_keyboard:true
							}
						});
						users.update({chat_id:query.chat_id},{$set:{agreement:true}},(err,numReplaced)=>{console.log('Updated info for @'+ query.username)})
					}
					else{
						bot.sendMessage(query.chat_id,'Вы отказались принимать пользовательское соглашение. Если вы передумаете, отправьте команду /start .',{
							reply_markup:{
								hide_keyboard:true
							}
						});
						users.update({chat_id:query.chat_id},{$set:{agreement:false}},(err,numReplaced)=>{console.log('Did not update info for @'+query.username)})
					}
				})
			);

		}
		else if(doc.agreement === true){
			bot.sendMessage(query.chat_id,'У вас уже имеется читательский билет.\nВаш номер: '+doc._id);
		}
	});	
}

var check_and_go = function(query){
	var chat_id = query.chat_id;
	var text = query.text;
	users.findOne({chat_id:chat_id},(err,doc)=>{
		if(doc === null){
			bot.sendMessage(chat_id,'Для получения читательского билета отправьте /start .');
		}

		else if(doc.agreement === false){
			bot.sendMessage(chat_id,'Вы отказались принять пользовательское соглашение. Для возообновления процедуры отправьте /start .');

		}
		else if(commands.add.test(query.text) === true){add(query);}
		else if(commands.find.test(query.text) === true){find(query);}
		else if(commands.help.test(query.text) === true){help_me(query);}
		else if(commands.authors.test(query.text) === true){authors(query);}
		else if(commands.stats.test(query.text) === true){stats(query);}
		else if(commands.about.test(query.text) === true){tell_about(query);}
		else if(commands.donate.test(query.text)=== true){donate(query);}
		else if(commands.todo.test(query.text) === true){todo(query);}
		
	});
}

var tell_about = function(query){
	var chat_id = query.chat_id;
	bot.sendMessage(chat_id, 'Небольшая библиотека, наполняемая пользователями.\nХранение произведений на сервере пока не реализовано, поэтому используются прямые ссылки.')
}

var help_me = function(query){
	var chat_id = query.chat_id;
	bot.sendMessage(chat_id, 'Выберите раздел',{
		reply_markup:{
			keyboard:[['Команды'],['Поиск книг/статей'],['Добавление книг/статей']]
		}
	}).then(
		bot.once('message',(msg)=>{
			if(msg.text === 'Команды'){
				bot.sendMessage(chat_id,'Вот список команд, которые я понимаю:\n'+commands_str,{
					reply_markup:
					{
						hide_keyboard:true
					}
				});
			}
			else if(msg.text === 'Поиск книг/статей'){
				bot.sendMessage(chat_id,'1. При вызове команды /find вам будет предложено выбрать категорию для поиска: Книги или Статьи.\n'
									   +'2. После выбора категории вы выбираете способ поиска: по названию либо по автору.\n'
									   +'3. В некоторых случаях бот может попросить уточнить запрос.\n'
									   +'4. Если книга или статья имеется в библиотеке, вы получаете ссылку на неё.',{
									   	reply_markup:
									   	{
									   		hide_keyboard:true
									   	}
									   });
			}
			else if(msg.text === 'Добавление книг/статей'){
				bot.sendMessage(chat_id,'1. При вызове команды /add вам будет предложено выбрать категорию: Книги или Статьи.\n'
									   +'2. После выбора категории вы отправляете информацию о книге/статье (Название, автор).\n'
									   +'3. В конце бот попросит вас отправить ссылку на произведение. Будьте внимательнее при добавлении.\n'
									   +'4. Если все прошло удачно, произведение добавляется в библиотеку и доступно для поиска.',{
									   	reply_markup:{
									   		hide_keyboard:true
									   	}
									   });
			}
		})
	)
}


var add = function(query){
	var chat_id = query.chat_id;
	bot.sendMessage(chat_id,'Выберите категорию.',{
		reply_markup:{
			keyboard:[['Книги'],['Статьи']]
		}
	}).then(
		bot.once('message',(msg)=>{
			var query = {
				chat_id		: msg.chat.id,
				text 		: msg.text,
				name 		: msg.chat.first_name+' '+msg.chat.last_name,
				username	: msg.chat.username
			};
			if(query.text === 'Книги'){
				add_book(query);
			}
			else if(query.text === 'Статьи'){
				add_article(query);
			}
		})
	)
}

var add_book = function(query){
	var chat_id = query.chat_id;
	bot.sendMessage(chat_id,'Отправьте название книги.',{
		reply_markup:{
			hide_keyboard:true
		}
	}).then(
		bot.once('message',(msg)=>{
			var Book_name = msg.text.toString().toLowerCase();
			bot.sendMessage(chat_id,'Отправьте имя автора (одного) в формате:\nИ. Фамилия').then(
				bot.once('message',(msg)=>{
					if(author_exp.test(msg.text)===true){
						var Book_author = msg.text.toString().toLowerCase();
						bot.sendMessage(chat_id,'Отправьте ссылку на книгу в формате:\nhttp://xxxx.yyy/zzzz').then(
								bot.once('message',(msg)=>{
									if(url_exp.test(msg.text)===true){
										var Book_url = msg.text.toString().toLowerCase();
										bot.sendMessage(chat_id,'Книга успешно добавлена.')
										books.insert({name:Book_name,author:Book_author,url:Book_url,submitted_by:chat_id})
									}
									else{
										bot.sendMessage(chat_id,'Ошибка в формате ссылки.')
									}
								})
							)
					}
					else{
						bot.sendMessage(chat_id,'Ошибка в формате имени.')
					}
				})
				)
		})
	)
}

var add_article = function(query){
	var chat_id = query.chat_id;
	bot.sendMessage(chat_id,'Отправьте название статьи.',{
		reply_markup:{
			hide_keyboard:true
		}
	}).then(
		bot.once('message',(msg)=>{
			var Art_name = msg.text.toString().toLowerCase();
			bot.sendMessage(chat_id,'Отправьте имя автора (одного) в формате:\nИ. Фамилия').then(
				bot.once('message',(msg)=>{
					if(author_exp.test(msg.text)===true){
						var Art_author = msg.text.toString().toLowerCase();
						bot.sendMessage(chat_id,'Отправьте ссылку на статью в формате:\nhttp://xxxx.yyy/zzzz').then(
								bot.once('message',(msg)=>{
									if(url_exp.test(msg.text)===true){
										var Art_url = msg.text.toString().toLowerCase();
										bot.sendMessage(chat_id,'Статья успешно добавлена.');
										articles.insert({name:Art_name,author:Art_author,url:Art_url,submitted_by:chat_id});
									}
									else{
										bot.sendMessage(chat_id,'Ошибка в формате ссылки.');
									}
								})
							);
					}
					else{
						bot.sendMessage(chat_id,'Ошибка в формате имени.');
					}
				})
				);
		})
	);
}
var find = function(query){
	var chat_id = query.chat_id;
	bot.sendMessage(chat_id,'Выберите категорию',{
		reply_markup:
		{
			keyboard:[['Книги'],['Статьи']]
		}
	}).then(
		bot.once('message',(msg)=>{
			if(msg.text === 'Книги'){
				query.search = "book";
				search(query);
			}
			else if(msg.text === 'Статьи'){
				query.search = "article";
				search(query);
			}
		})
	);

}

var search = function(query){
	var chat_id = query.chat_id;
	bot.sendMessage(chat_id,'Выберите способ поиска',{
		reply_markup:{
			keyboard:[['По названию'],['По автору']]
		}
	}).then(
		bot.once('message',(msg)=>{
			if(msg.text === 'По названию'){
				query.field = "name";
				search_final(query);
			}
			else if(msg.text === 'По автору'){
				query.field = "author";
				search_final(query);
			}
		})
	);
}

var search_final = function(query){
	var chat_id = query.chat_id;
	bot.sendMessage(chat_id,'Введите запрос.\nК примеру, часть названия книги, либо фамилию автора.',{
		reply_markup:{
			hide_keyboard:true
		}
	}).then(
		bot.once('message',(msg)=>{
			console.log(query);
			var re = new RegExp(msg.text.toString().toLowerCase());
			if(query.search === 'book'){
				books.find({[query.field]:{$regex:re}},(err,docs)=>{
					parse_results(query,docs);
				});
			}
			else if(query.search === 'article'){
				articles.find({[query.field]:{$regex:re}},(err,docs)=>{
					parse_results(query,docs);
				});
			}
		})
	);
}

var results_to_array = function(docs){
	results = [];
	for (var i = 0; i < docs.length; i++) {
		results.push(docs[i].name.toString().toUpperCase());
	}
	return results
}

var authors_to_array = function(docs){
	results = [];
	for (var i = 0; i < docs.length; i++){
		results.push(docs[i].author.toString().toUpperCase());
	}
	return results
}

var parse_results = function(query,docs){
	var chat_id = query.chat_id;
	if(docs.length === 0){
		bot.sendMessage(chat_id,'К сожалению, по вашему запросу я не смог ничего найти. Попробуйте уточнить.');
	}
	else if(docs.length === 1){
		bot.sendMessage(chat_id,'По вашему запросу я нашел: "'+docs[0].name.toString().toUpperCase()+'"\nВот ссылка на файл: '+docs[0].url);
	}
	else if(docs.length > 1){
		var a = results_to_array(docs);
		if(query.field === 'name'){
			bot.sendMessage(chat_id,'По вашему запросу я нашел несколько произведений:\n'+a.join('\n')+'\nОтправьте мне полное название и я дам ссылку.').
			then(
				bot.once('message',(msg)=>{
					var re = new RegExp(msg.text.toString().toLowerCase());
					if(query.search === 'book'){
						books.findOne({[query.field]:{$regex:re}},(err,doc)=>{
							docs =[];
							docs.push(doc);
							parse_results(query,docs);
						});
					}
					else if(query.search === 'article'){
						articles.findOne({[query.field]:{$regex:re}},(err,doc)=>{
							docs = [];
							docs.push(doc); 
							parse_results(query,docs);
						});
					}
				})
			);
		}
		else if(query.field === 'author'){
			bot.sendMessage(chat_id,'У данного автора несколько произведений:\n'+a.join('\n')+'\nОтправьте мне полное название и я дам ссылку.').then(
				bot.once('message',(msg)=>{
					var re = new RegExp(msg.text.toString().toLowerCase());
					if(query.search === 'book'){
						books.find({name:{$regex:re}},(err,docs)=>{parse_results(query,docs);})
					}
					else if(query.search === 'article'){
						articles.find({name:{$regex:re}},(err,docs)=>{parse_results(query,docs);})
					}
				})
				);

		}
	}
}

var stats = function(query){
	var chat_id = query.chat_id;
	bot.sendMessage(chat_id,'У нас доступна статистика нескольких видов',{
		reply_markup:
		{
			keyboard:[['Пользователи'],['Книги'],['Статьи']]
		}
	}).then(
		bot.once('message',(msg)=>{
			if(msg.text === 'Пользователи'){
				users.count({},(err,count)=>{
					bot.sendMessage(chat_id,'Число пользователей на данный момент:\n'+count,{
						reply_markup:
						{
							hide_keyboard: true
						}
					});
				});
			}
			else if(msg.text ==='Книги'){
				books.count({},(err,count)=>{
					bot.sendMessage(chat_id,'Число книг на данный момент:\n'+count,{
						reply_markup:
						{
							hide_keyboard: true
						}
					});
				});
			}
			else if(msg.text === 'Статьи'){
				articles.count({},(err,count)=>{
					bot.sendMessage(chat_id,'Число статей на данный момент:\n'+count,{
						reply_markup:
						{
							hide_keyboard:true
						}
					});
				});
			}
		})
	);
}

var donate = function(query){
	var chat_id = query.chat_id;
	bot.sendMessage(chat_id,'Принимаю пожертвования на развитие сервиса:\n1LHw6kf6GctG7MRJzTgWrpeXP7JLnkMUvC BTC');
}


var authors = function(query){
	var chat_id = query.chat_id;
	bot.sendMessage(chat_id,'Доступны списки авторов для книг и статей.',{
		reply_markup:{
			keyboard:[['Книги'],['Статьи']]
		}
	}).then(
		bot.once('message',(msg)=>{
			if(msg.text === 'Книги'){query.authors = 'books';authors_all(query);}
			else if(msg.text === 'Статьи'){query.authors = 'articles';authors_all(query);}
		})
	)
}

var uniq = function (a) {
   return Array.from(new Set(a));
};

var authors_all = function(query){
	var chat_id = query.chat_id;
	if(query.authors === 'books'){
		books.find({},(err,docs)=>{
			var a = uniq(authors_to_array(docs)).sort();
			bot.sendMessage(chat_id,'На данный момент в нашей библиотеке есть книги следующих авторов:\n'+a.join('\n')+'\nОтправьте имя автора и получите список книг.',{
				reply_markup:{
					hide_keyboard:true
				}
			}).then(
				bot.once('message',(msg)=>{
					if(author_exp.test(msg.text)===true){
						query.search = 'books';
						query.field = 'author';
						query.text = msg.text.toString().toLowerCase();
						author_all(query);
					}
					else{
						bot.sendMessage(chat_id,'Ошибка, попробуйте снова.');
					}
				})
			)
		})
	}
	else if(query.authors === 'articles'){
		articles.find({},(err,docs)=>{
			var a = uniq(authors_to_array(docs)).sort();
			bot.sendMessage(chat_id,'На данный момент в нашей библиотеке есть статьи следующих авторов:\n'+a.join('\n')+'\nОтправьте имя автора и получите список статей.',{
				reply_markup:{
					hide_keyboard:true
				}
			}).then(
				bot.once('message',(msg)=>{
					if(author_exp.test(msg.text)===true){
						query.search = 'articles';
						query.field = 'author';
						query.text = msg.text.toString().toLowerCase();
						author_all(query);
					}
					else{
						bot.sendMessage(chat_id,'Ошибка, попробуйте снова.');
					}
				})
			)
		})
	}
}

var author_all = function(query){
	var chat_id = query.chat_id;
	if(query.search === 'books'){
		var re = new RegExp(query.text);
		books.find({[query.field]:{$regex:re}},(err,docs)=>{
			if(docs.length === 0){
				bot.sendMessage(chat_id,'Ошибка, попробуйте снова.')
			}
			else{
				var a = results_to_array(docs);
				bot.sendMessage(chat_id,'Вот книги автора '+query.text.toString().toUpperCase()+':\n'+a.join('\n')+'\nОтправьте название книги, чтобы получить на неё ссылку.').then(
					bot.once('message',(msg)=>{
						query.srch = msg.text.toString().toLowerCase();
						author_one(query);
					})
					)
			}
		})
	}
	else if(query.search === 'articles'){
		var re = new RegExp(query.text);
		articles.find({[query.field]:{$regex:re}},(err,docs)=>{
			if(docs.length === 0){
				bot.sendMessage(chat_id,'Ошибка, попробуйте снова.')
			}
			else{
				var a = results_to_array(docs);
				bot.sendMessage(chat_id,'Вот статьи автора '+query.text.toString().toUpperCase()+':\n'+a.join('\n')+'\nОтправьте название книги, чтобы получить на неё ссылку.').then(
					bot.once('message',(msg)=>{
						query.srch = msg.text.toString().toLowerCase();
						author_one(query);
					})
					)
			}
		})
	}
}

var author_one = function(query){
	var chat_id = query.chat_id;
	if(query.search === 'books'){
		var re = new RegExp(query.text);
		var re2 = new RegExp(query.srch);
		books.findOne({$and:[{author:{$regex:re}},{name:{$regex:re2}}]},(err,doc)=>{
			docs = [];
			docs.push(doc);
			parse_results(query,docs);
		})
	}
	else if(query.search === 'articles'){
		var re = new RegExp(query.text);
		var re2 = new RegExp(query.srch);
		articles.findOne({$and:[{author:{$regex:re}},{name:{$regex:re2}}]},(err,doc)=>{
			docs = [];
			docs.push(doc);
			parse_results(query,docs);
		})
	}

}

var todo = function(query){
	var chat_id = query.chat_id;
	bot.sendMessage(chat_id,'Библиотека работает в тестовой версии. В планах добавить:\n1) Хранение файлов на сервере и возможность добавления файла книги/статьи.\n2) Разбивка книг/статей по тематикам и возможность поиска по тематикам.\n3) Оптимизация поиска.\nВы можете поддержать проект! Просто отправьте /donate для получения подробностей.')
}

bot.on('message',(msg)=>{
	if(msg.chat.type !== 'private'){
		bot.sendMessage(msg.chat.id,'Я не работаю в публичных чатах. Строго личные сообщения.');
	}
	else{
	var query = {
		chat_id		: msg.chat.id,
		text 		: msg.text,
		name 		: msg.chat.first_name+' '+msg.chat.last_name,
		username	: msg.chat.username
	};
	if(commands.start.test(query.text) === true){
		console.log('Start');
		add_user(query);
	}
	else if (query.text !== 'Принять' && query.text !== 'Отказаться'){
		check_and_go(query);
	}
	}
});


