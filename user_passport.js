/*
 * 라우팅 함수 정의
 */

module.exports = function(router, passport, upload) {
    console.log('user_passport 호출됨.');
			
	var an = 0;
	var dbm = require('../database/database');
	console.log('database 모듈 가져옴');
	
	var profile_img;
	var profile_photo;
	var flag=1,
		flag2=1;
	
	var event_search = {
        'teamname':'',
        'add': '',
        'gender': '',
        'age': '',
        'event_time': '',
        'event_day': ''
    };	
	
	var selectone = {
			user:'',
			date:'',
			time:'',
			region:''
		}

	
	//홈 화면, 추천
	router.route('/').get(function(req, res) {
		 console.log('/ 패스 get 요청됨.');		 
     
        // 인증 안된 경우
        if (!req.user) {
            console.log('사용자 인증 안된 상태임.');
            res.redirect('/login');
        } else {
			
			// expire
			var newDate = new Date();
			var nowYear = newDate.getFullYear();
			var nowMonth = (newDate.getMonth() + 1);
			var nowDate = newDate.getDate();
			
			dbm.ApplicationModel.remove({'eventYear_forExpire':{$lt:nowYear}}, function(err){
				if(err) throw err
			});
			
			dbm.ApplicationModel.remove({'eventMonth_forExpire':{$lt:nowMonth}}, function(err){
				if(err) throw err
			});

			dbm.ApplicationModel.remove({$and:[{'eventMonth_forExpire':nowMonth}, {'eventDate_forExpire':{$lt:nowDate}}]}, function(err){
				if(err) throw err
			});


			
			var fs = require('fs');
			
			const Json2csvParser = require('json2csv').Parser;
			const fields = ['email', 'age', 'gender', 'nofteam', 'career_year', 'career_count', 'geoLng', 'geoLat',/*여기까지*/ 'teamname', 'region', 'add', 'move', 'event_date', 'event_time', 'event_day', 'event_day', 'mention', 'created_month', 'creted_day', 'application_number', 'eventYear_forExpire', 'eventMonth_forExpire', 'eventDate_forExpire'];
			const eventData = [];	
			
			var userdata = {
				'email':req.user.email,
				'age':req.user.age,
				'gender':req.user.gender,
				'nofteam':req.user.nofteam,
				'career_year':req.user.career_year,
				'career_count':req.user.career_count,
				'geoLng':req.user.geoLng,
				'geoLat':req.user.geoLat
			};
			var j=1;
			eventData[0] = userdata;
			
			
			dbm.ApplicationModel.find({email:{$ne:req.user.email}}, function (err, result) {				
				for(var i = 0 ; i < result.length ; i++) {
					var data = {
						'email' : result[i]._doc.email, 
						'teamname' : result[i]._doc.teamname,
						'career_year' : result[i]._doc.career_year,
						'career_count' : result[i]._doc.career_count,
						'region' : result[i]._doc.region,
						'add' : result[i]._doc.add,
						'move' : result[i]._doc.move,
						'age' : result[i]._doc.age,	
						'gender' : result[i]._doc.gender,
						'event_date' : result[i]._doc.event_date,
						'event_time' : result[i]._doc.event_time,
						'event_day' : result[i]._doc.event_day,
						'mention' : result[i]._doc.mention,	
						'nofteam' : result[i]._doc.nofteam,
						'geoLng' : result[i]._doc.geoLng,
						'geoLat' : result[i]._doc.geoLat,
						'created_month' : result[i]._doc.created_month,
						'created_day' : result[i]._doc.created_day,
						'application_number' : result[i]._doc.application_number
					};										
					eventData[j] = data;
					j+=1;
				}
				const json2csvParser = new Json2csvParser({ fields });
				const csv = json2csvParser.parse(eventData);

				fs.writeFile('recEvent.csv', csv, 'utf8', function(err){
					if(err) throw err
					console.log('File Write.');
				});	
			});			
			
			var pythonShell = require('python-shell');
			
			var options = {
				pythonPath: '',
				pythonOptions:['-u'],
				scriptPath: ''
			};
			
			pythonShell.run('recEvent.py', options, function(err, results){
				if(err) throw err
				
				console.log('Python run');
				console.log('%j', results)
			});		
			
			res.render('loading.ejs');
		}        
    });
	
	router.route('/main').get(function(req, res){
		console.log('/main 패스 get 요청됨.');		 
     
        // 인증 안된 경우
        if (!req.user) {
            console.log('사용자 인증 안된 상태임.');
            res.redirect('/login');
        } else {
			var csvf = require('csvtojson');

			csvf()
			.fromFile('recOutput.csv')
			.then(function(output){

				profile_photo = req.user.profile_img;			
				if(profile_img == null)
					profile_img = req.user.profile_img;
				if(profile_img != req.user.profile_img)
					profile_photo = profile_img;

				var user_context = {
					'email':req.user.email, 
					'password':req.user.password, 
					'teamname':req.user.teamname, 
					'gender':req.user.gender, 
					'age':req.user.age,
					'region':req.user.region,
					'add':req.user.add,
					'move':req.user.move,
					'nofteam':req.user.nofteam,
					'career_year':req.user.career_year,
					'career_count':req.user.career_count,
					'introteam':req.user.introteam,
					'profile_img':profile_photo,
					'event_data':output
				};

				console.dir(user_context);

				res.render('main.ejs', user_context);				
			});
		}
	});

	router.route('/main').post(function(req, res) {
        console.log('/main 패스 post 요청됨.');

        var others = {
            'sEmail': req.body.sEmail,
            'sTeamname': req.body.sTeamname,
            'sAdd': [req.body.sAdd0, req.body.sAdd1],
            'sRegion': req.body.sRegion,
            'sMove' : req.body.sMove,
            'sAge': req.body.sAge,
            'sGender': req.body.sGender,
            'sEvent_date': req.body.sDate,
            'sEvent_time': req.body.sTime,
            'sEvent_day' : req.body.sDay,
            'sMention': req.body.sMention,
            'sCreatedMonth' : req.body.sCreatedMonth,
            'sCreatedDay' : req.body.sCreatedDay,
            'sGeoLng': req.body.sGeoLng,
            'sGeoLat': req.body.sGeoLat,
            'sNofteam': req.body.sNofteam,
			'sApplicationNumber':req.body.sApplicationNumber,
            'sScore': 0,
            'sReceivedReview' : 0,
            'sReceivedReviewComment' : '',
            'sReviewDate' : ''
        };
        

        var event = {
            'email': req.user.email,
            'password': req.user.password,
            'teamname': req.user.teamname,
            'add' : req.user.add,
            'region': req.user.region,
            'move': req.user.move,
            'gender': req.user.gender,
            'age': req.user.age,
            'nofteam': req.user.nofteam,
            'career_year': req.user.career_year,
            'career_count': req.user.career_count,
            'introteam': req.user.introteam,
            'profile_img': profile_photo,
            'others':others
        };

        var event_match = new dbm.MatchModel(event);

        event_match.save(function (err, data) {
            if (err) {// TODO handle the error
                console.log("match save error");
                console.log('err : ' + err);
                console.log('data : ' + data);
            }
            console.log('New match inserted');
            console.log('data : ' + data);
        });

        res.redirect('/');

    });
	
	
	/*
	router.route('/').post(function(req, res){
		var kofsort = req.body.sort || req.query.sort;
		console.log(kofsort);
			
			if(kofsort == 1){
				res.redirect('/regionsort');
			}else if(kofsort == 2){
				res.redirect('gendersort');
			}else if(kofsort == 3){
				res.redirect('/agesort');
			}
	});
	
	router.route('/regionsort').get(function(req, res){
		
	});
	
	router.route('/gendersort').get(function(req, res){
		console.log('Search by gender');
		
		// 인증 안된 경우
        if (!req.user) {
            console.log('사용자 인증 안된 상태임.');
            res.redirect('/login');
        } else {
			var dbm = require('../database/database');
			console.log('database 모듈 가져옴');
			const eventData = [];
			
			dbm.ApplicationModel.find({gender:req.user.gender},function (err, result) {				
				for(var i = 0 ; i < result.length ; i++) {
						var data = {
							'email' : result[i]._doc.email, 
							'teamname' : result[i]._doc.teamname,
							'region' : result[i]._doc.region,
							'place' : result[i]._doc.place,
							'move' : result[i]._doc.move,
							'age' : result[i]._doc.age,	
							'gender' : result[i]._doc.gender,
							'event_date' : result[i]._doc.event_date,
							'event_time' : result[i]._doc.event_time,
							'event_day' : result[i]._doc.event_day,
							'mention' : result[i]._doc.mention,	
							'nofteam' : result[i]._doc.nofteam,
							'geoLng' : result[i]._doc.geoLng,
							'geoLat' : result[i]._doc.geoLat,
							'created_month' : result[i]._doc.created_month,
							'created_day' : result[i]._doc.created_day
						};
					eventData[i] = data;
					}
				
				var user_context = {
					'email':req.user.email,
					'teamname':req.user.teamname, 
					'gender':req.user.gender, 
					'age':req.user.age,
					'region':req.user.region,
					'move':req.user.move,
					'nofteam':req.user.nofteam,
					'career_year':req.user.career_year,
					'career_count':req.user.career_count,
					'introteam':req.user.introteam,
					'profile_img':profile_photo,
					'event_data':eventData
				};
				
				console.dir(user_context);
				
							
            	res.render('main.ejs', user_context);			
			});			
		}
			
	});
	
	router.route('/agesort').get(function(req, res){
		console.log('Search by age');
		// 인증 안된 경우
        if (!req.user) {
            console.log('사용자 인증 안된 상태임.');
            res.redirect('/login');
        } else {
			var dbm = require('../database/database');
			console.log('database 모듈 가져옴');
			const eventData = [];
			
			dbm.ApplicationModel.find({age: { $gt: req.user.age-5 , $lte: req.user.age+5 } },function (err, result) {				
				for(var i = 0 ; i < result.length ; i++) {
						var data = {
							'email' : result[i]._doc.email, 
							'teamname' : result[i]._doc.teamname,
							'region' : result[i]._doc.region,
							'place' : result[i]._doc.place,
							'move' : result[i]._doc.move,
							'age' : result[i]._doc.age,	
							'gender' : result[i]._doc.gender,
							'event_date' : result[i]._doc.event_date,
							'event_time' : result[i]._doc.event_time,
							'event_day' : result[i]._doc.event_day,
							'mention' : result[i]._doc.mention,	
							'nofteam' : result[i]._doc.nofteam,
							'geoLng' : result[i]._doc.geoLng,
							'geoLat' : result[i]._doc.geoLat,
							'created_month' : result[i]._doc.created_month,
							'created_day' : result[i]._doc.created_day
						};
					eventData[i] = data;
					}
				
				var user_context = {
					'email':req.user.email,
					'teamname':req.user.teamname, 
					'gender':req.user.gender, 
					'age':req.user.age,
					'region':req.user.region,
					'move':req.user.move,
					'nofteam':req.user.nofteam,
					'career_year':req.user.career_year,
					'career_count':req.user.career_count,
					'introteam':req.user.introteam,
					'profile_img':profile_photo,
					'event_data':eventData
				};
				
				console.dir(user_context);
				
							
            	res.render('main.ejs', user_context);			
			});			
		}
			
	});
	*/
	
    // 로그인 화면
    router.route('/login').get(function(req, res) {
        console.log('/login 패스 get 요청됨.');
        res.render('login.ejs', {message: req.flash('loginMessage')});
    });
	 
	
    // 로그인 인증
    router.route('/login').post(passport.authenticate('local-login', {
        successRedirect : '/', 
        failureRedirect : '/login', 
        failureFlash : true 
    }));

	
	
    // 회원가입 화면
    router.route('/teamsignup').get(function(req, res) {
        console.log('/teamsignup 패스 get 요청됨.');
		flag=0, flag2=0;
        res.render('team_signup.ejs', {message: req.flash('signupMessage')});
    });
	
	// 회원가입 인증
    router.route('/teamsignup').post(passport.authenticate('local-signup', {
        successRedirect : '/uploadimg', 
        failureRedirect : '/teamsignup', 
        failureFlash : true 
    }));
	
	
	// 프로필 사진
	router.route('/uploadimg').get(function(req, res){
		console.log('/uploadimg 패스 get 요청됨.');
		
		
		// 인증 안된 경우
        if (!req.user) {
            console.log('사용자 인증 안된 상태임.');
            res.redirect('/');
        } else {
            console.log('사용자 인증된 상태임.');
			
			console.log(profile_img);
			console.log(req.user.profile_img);
			
			if(flag == 0)
				profile_photo = req.user.profile_img;
			else{
				profile_photo = req.user.profile_img;			
				if(profile_img == null)
					profile_img = req.user.profile_img;
				if(profile_img != req.user.profile_img)
					profile_photo = profile_img;
			}
			
			console.log(profile_img);
			console.log(req.user.profile_img);

			
			var user_context = {
				'email':req.user.email, 
				'password':req.user.password, 
				'teamname':req.user.teamname, 
				'gender':req.user.gender, 
				'age':req.user.age,
	//			'region':req.user.region,
	//			'add':req.user.add,
				'move':req.user.move,
				'nofteam':req.user.nofteam,
				'career_year':req.user.career_year,
				'career_count':req.user.career_count,
				'introteam':req.user.introteam,
				'profile_img':profile_photo
			};
						
			flag=1;
            res.render('upload_img.ejs', user_context);
		}
	});
	
	
	router.route('/uploadimg').post(upload.array('photo'), function(req, res){		
		try{			
			var files = req.files;
			console.log(req.files);

			console.log('===== 업로드 된 사진 =====');
			console.dir(files[0]);
			console.log('===================================');

			var originalname = '',
				filename = '',
				mimetype = '',
				size = 0;

			if(Array.isArray(files)){
				for(var i=0; i<files.length; i++){
					originalname = files[i].originalname;
					filename = files[i].filename;
					mimetype = files[i].mimetype;
					size = files[i].size;
				}	
			}


			console.log('파일 업로드 성공!');
			console.log('현재 파일 정보 : ' + originalname + ', ' + filename + ', ' + mimetype + ', ' + size);
			
		
			if(filename)
				profile_img = filename;
			else
				profile_img = req.user.profile_img;


			dbm.db.collection("users6").updateOne({email: req.user.email},  {$set: {'profile_img':profile_img}}, function(err, res) {
				if (err) throw err;
				console.log("======== set profile image =======");
				console.dir(req.user.profile_img);
			});


		}catch(err){
			console.dir(err.stack);
		}
		
		if(flag2 == 0){
			flag2=1;
			res.redirect('/login');
		}		
		else{
			flag2=1;
			res.redirect('/');
		}
	});


	
    // 프로필 
    router.route('/teamprofile').get(function(req, res) {
        console.log('/teamprofile 패스 get 요청됨.');

        // 인증 안된 경우
        if (!req.user) {
            console.log('사용자 인증 안된 상태임.');
            res.redirect('/login');
        } else {
            console.log('사용자 인증된 상태임.');
   
			profile_photo = req.user.profile_img;			
			if(profile_img == null)
				profile_img = req.user.profile_img;
			if(profile_img != req.user.profile_img)
				profile_photo = profile_img;
			
			
						
			var user_context = {
				'email':req.user.email, 
				'password':req.user.password, 
				'teamname':req.user.teamname, 
				'gender':req.user.gender, 
				'age':req.user.age,
				'region':req.user.region,
				'add':req.user.add,
				'move':req.user.move,
				'nofteam':req.user.nofteam,
				'career_year':req.user.career_year,
				'career_count':req.user.career_count,
				'introteam':req.user.introteam,
				'profile_img':profile_photo
			};
			
			console.log(user_context.profile_img);
						
			
            res.render('team_profile.ejs', user_context);
		}
    });
	
    
	router.route('/teamprofileedit').get(function(req, res){
		console.log('/teamprofileedit 패스 get 요청됨.');
	
		
		 // 인증 안된 경우
        if (!req.user) {
            console.log('사용자 인증 안된 상태임.');
            res.redirect('/login');
        } else {
			
			profile_photo = req.user.profile_img;			
			if(profile_img == null)
				profile_img = req.user.profile_img;
			if(profile_img != req.user.profile_img)
				profile_photo = profile_img;

			
			var user_context = {
				'email':req.user.email, 
				'password':req.user.password, 
				'teamname':req.user.teamname, 
				'gender':req.user.gender, 
				'age':req.user.age,
				'region':req.user.region,
				'add':req.user.add,
				'move':req.user.move,
				'nofteam':req.user.nofteam,
				'career_year':req.user.career_year,
				'career_count':req.user.career_count,
				'introteam':req.user.introteam,
				'profile_img':profile_photo
			};	
			
            console.log('사용자 인증된 상태임.');
            res.render('team_profile_edit.ejs', user_context);
        }
		
	})
	
    router.route('/teamprofileedit').post(function(req, res) {
        console.log('/teamprofileedit 패스 post 요청됨.');
		
		profile_photo = req.user.profile_img;			
		if(profile_img == null)
			profile_img = req.user.profile_img;
		if(profile_img != req.user.profile_img)
			profile_photo = profile_img;


		var user_context = {
			'email':req.user.email, 
			'teamname':req.user.teamname, 
			'gender':req.user.gender, 
			'age':req.user.age,
			'region':req.user.region,
			'add':req.user.add,
			'geoLat':req.user.geoLat,
			'geoLng':req.user.geoLng,
			'move':req.user.move,
			'nofteam':req.user.nofteam,
			'career_year':req.user.career_year,
			'career_count':req.user.career_count,
			'introteam':req.user.introteam,
			'profile_img':profile_photo
		};
		
		
		if(req.body.teamname || req.query.teamname){
			user_context.teamname = req.body.teamname || req.query.teamname;
		}
		if(req.body.gender || req.query.gender){
			user_context.gender = req.body.gender || req.query.gender;
		}
		if(req.body.age || req.query.age){
			user_context.age = req.body.age || req.query.age;
		}
		if(req.body.region || req.query.region){
			user_context.add = req.body.add || req.query.add;
			if(!user_context.add){		//도로명 주소 없을 경우 지번 주소
				user_context.add = req.body.add2 || req.query.add2;
			}else{		
				var addr = [];
				addr= user_context.add.split(' ');

				if(addr[0] == '제주특별자치도'){
					user_context.add = [addr[1], addr[2]];
				}else
					user_context.add = [addr[0], addr[1]];
			}
			
			user_context.region = req.body.region || req.query.region;
			user_context.geoLat = req.body.resultLat || req.query.resultLat;
			user_context.geoLng = req.body.resultLng || req.query.resultLng;
		}
		if(req.body.move || req.query.move){
			user_context.move = req.body.move || req.query.move;
		}
		if(req.body.nofteam || req.query.nofteam){
			user_context.nofteam = req.body.nofteam || req.query.nofteam;
		}
		if(req.body.career_year || req.query.career_year){
			user_context.career_year = req.body.career_year || req.query.career_year;
		}
		if(req.body.career_count || req.query.career_count){
			user_context.career_count = req.body.career_count || req.query.career_count;
		}
		if(req.body.introteam || req.query.introteam){
			user_context.introteam = req.body.introteam || req.query.introteam;
		}
		
		console.log('=== Profile edit ===')
		console.dir(user_context);

		dbm.db.collection("users6").updateOne({email: user_context.email},  {$set: user_context}, function(err, res) {
    		if (err) throw err;
    		console.log("=== Profile updated ===");
  		});
		
		res.redirect('/profileeditok');
    });
	
	router.route('/profileeditok').get(function(req, res){
		console.log('/profileeditok 패스 get 요청됨.');
		
		if(!req.user){
			console.log('사용자 인증 안된 상태임.');
			res.redirect('/login');
		}
		else{
			console.log('회원정보 수정 완료.');
			res.render('profile_edit_ok.ejs');
		}
	});
	
        
    //아이디, 비밀번호 찾기
    router.route('/findid').get(function(req, res){
        console.log('/findid 패스 get 요청됨.');
        res.render('find_id.ejs');        
    });
    
    router.route('/findpassword').get(function(req,res){
        console.log('/findpassword 패스 get 요청됨.');        
        res.render('find_password.ejs');
    });
	
	//채팅
    router.route('/chatroomchat').get(function(req, res){
        console.log('/chatrooomchat 패스 get으로 요청됨.');

        if (!req.user) {
            console.log('사용자 인증 안된 상태임.');
            res.redirect('/');
        }else{
            profile_photo = req.user.profile_img;
            if(profile_img == null)
                profile_img = req.user.profile_img;
            if(profile_img != req.user.profile_img)
                profile_photo = profile_img;

            var dbm = require('../database/database');
            console.log('database 모듈 가져옴');

            var eventData = new Array();
            var j = 0;

            // 나한테 매칭 신청한 팀 찾기
            dbm.MatchModel.find({email : {"$ne" : req.user.email}} ,function (err, result) {
                for (var i = 0; i < result.length; i++) {
                    if (result[i]._doc.others.sEmail === req.user.email) {
                        var data = {
                            'email' : req.user.email, // 나
                            'otherEmail': result[i]._doc.email, //상대팀
                            'match_success': result[i]._doc.match_success, //매치 수락 여부
                            'otherTeamname': result[i]._doc.teamname // 상대팀 팀명
                        };
                        eventData[j++] = data;
                    }
                }

                // 내가 매칭 신청한 팀 찾기
                dbm.MatchModel.find({email : req.user.email} ,function (err, result) {
                    for (var i = 0; i < result.length; i++) {
                        if (result[i]._doc.email === req.user.email) {
                            var data = {
                                'email': result[i]._doc.email,//나
                                'otherEmail': result[i]._doc.others.sEmail, // 상대팀
                                'match_success': result[i]._doc.match_success, //매치 수락 여부
                                'otherTeamname': result[i]._doc.others.sTeamname // 상대팀 팀명
                            };
                            eventData[j++] = data;
                        }
                    }
                    var user_context = {
                        'email': req.user.email,
                        'password': req.user.password,
                        'teamname': req.user.teamname,
                        'gender': req.user.gender,
                        'age': req.user.age,
                        'region': req.user.region,
                        'move': req.user.move,
                        'nofteam': req.user.nofteam,
                        'career_year': req.user.career_year,
                        'career_count': req.user.career_count,
                        'introteam': req.user.introteam,
                        'profile_img': profile_photo,
                        'event_data': eventData
                    };
                    console.dir(eventData);
                    res.render('chat_room_chat.ejs', user_context);
                });
            });
        }
    });
	
	 router.route('/chatroommessage').get(function(req, res){
        console.log('/chatroommessage 패스 get으로 요청됨.');

        if (!req.user) {
            console.log('사용자 인증 안된 상태임.');
            res.redirect('/');
        }else {
            profile_photo = req.user.profile_img;
            if (profile_img == null)
                profile_img = req.user.profile_img;
            if (profile_img != req.user.profile_img)
                profile_photo = profile_img;

            var eventData = new Array();
            var j = 0;

            // 내가 올린 매칭을 상대방이 신청할 경우 찾기
            // 내가 아닌 사람이 올린 매칭 찾기
            dbm.MatchModel.find({email : {"$ne" : req.user.email}} ,function (err, result) {
                for (var i = 0; i < result.length; i++) {

                    // 그 중 내가 올렸던 매칭(others의 sEmail이 나인 것) 찾기
                    if (result[i]._doc.others.sEmail === req.user.email) {

                        // data는 내가 올린 글에 매칭 신청한 상대방 정보
                        var data = {
                            'sameEmailIndex' : 0,
                            'email': result[i]._doc.email,
                            'teamname': result[i]._doc.teamname,
                            'mention': result[i]._doc.mention,
                            'created_month': result[i]._doc.created_month,
                            'created_day': result[i]._doc.created_day,
                            'match_success' : result[i]._doc.match_success
                        };
                        eventData[j++] = data;
                        console.log(data);
                    }
                }

                // 같은 매칭 신청자 & 매칭 등록자 조합이 또 존재하는 경우 index++
                for (var a = 0; a < eventData.length; a++) {
                    for (var b = a + 1; b <eventData.length; b++ ){
                        if(eventData[a].email == eventData[b].email) {
                            eventData[b].sameEmailIndex++;
                        }
                    }
                }

                var user_context = {
                    'email': req.user.email,
                    'password': req.user.password,
                    'teamname': req.user.teamname,
                    'gender': req.user.gender,
                    'age': req.user.age,
                    'region': req.user.region,
                    'move': req.user.move,
                    'nofteam': req.user.nofteam,
                    'career_year': req.user.career_year,
                    'career_count': req.user.career_count,
                    'introteam': req.user.introteam,
                    'profile_img': profile_photo,
                    'event_data':eventData // 메시지 보낸 상대팀 정보
                };
                console.dir(eventData);
                res.render('chat_room_message.ejs', user_context);
            });
        }
    });

    // message get 역할 함
    router.route('/chatroommessage').post(function(req, res) {
        // ------------------------------- data 삽입위치 수정
        console.log('/chatroommessage 패스 post 요청됨.');
		
        //나한테 신청한 사람 이메일
        var otherEmail = req.body.sEmail;
        console.log('otherEmail : ' + req.body.sEmail);

        // 등록한 사람 나 : & 신청한 사람 : 그사람 중복되는 경우 index
        var sSameEmailIndex = req.body.sSameEmailIndex;
        console.log('sSameEmailIndex : ' + req.body.sSameEmailIndex);

        var j = 0;
        var eventData = new Array();

        // 나한테 신청한 사람 이메일 받아온거로 matches에서 email 찾아서
        dbm.MatchModel.find({email: otherEmail}, function (err, result) {
            console.log('result.length : ' + result.length);

            for (var i = 0; i < result.length; i++) {
                console.log('result[' + i + '].doc_others.email : ' + result[i]._doc.others.sEmail);
                console.log('req.user.email : ' + req.user.email);

                // 그 사람이 올린 것 중 신청자가 나일 경우
                if (result[i]._doc.others.sEmail === req.user.email) {

                    // 나한테 신청한 사람 정보
                    var data = {
                        'email': result[i]._doc.email,
                        'teamname': result[i]._doc.teamname,
                        'add': result[i]._doc.add,
                        'region': result[i]._doc.region,
                        'move': result[i]._doc.move,
                        'age': result[i]._doc.age,
                        'gender': result[i]._doc.gender,
                        'event_date': result[i]._doc.event_date,
                        'event_time': result[i]._doc.event_time,
                        'event_day': result[i]._doc.event_day,
                        'mention': result[i]._doc.mention,
                        'geoLng': result[i]._doc.geoLng,
                        'geoLat': result[i]._doc.geoLat,
                        'nofteam': result[i]._doc.nofteam,
                        'created_month': result[i]._doc.created_month,
                        'created_day': result[i]._doc.created_day,
                        'others': result[i]._doc.others //내가 등록한 매칭 정보
                    };
                    eventData[j++] = data;
                }
            }

            var user_context = {
                'email': req.user.email,
                'password': req.user.password,
                'teamname': req.user.teamname,
                'gender': req.user.gender,
                'age': req.user.age,
                'region': req.user.region,
                'move': req.user.move,
                'nofteam': req.user.nofteam,
                'career_year': req.user.career_year,
                'career_count': req.user.career_count,
                'introteam': req.user.introteam,
                'profile_img': profile_photo,
                'event_data': eventData,
                'sSameEmailIndex' : sSameEmailIndex // email 중복시 index
            };
            console.log(eventData);

            console.log('chatmessagepostend----------------------');
            res.render('message.ejs', user_context);
            console.log('render 함');
        });
    });

    router.route('/message').post(function(req, res) {
        console.log('/message 패스 post 요청됨');

        // 매칭 여부 (1: 승인 / 2: 거절 / 0: 대기);
        var match = req.body.match;
        console.log('match : ' + match);

        // 매칭 신청한 애
        var otherEmail = req.body.sEmail;
        console.log('otherEmail : ' + otherEmail);

        // 걔 동일 이메일 인덱스 있는지 확인
        var sSameEmailIndex = req.body.sSameEmailIndex;
        console.log('sSameEmailIndex : ' + sSameEmailIndex);

        var eventData = new Array();
        var j = 0;

        // 나한테 신청한 사람 이메일 받아온거로 matches에서 email 찾아서
        dbm.MatchModel.find({email: otherEmail}, function (err, result) {
            console.log('result.length : ' + result.length);

            for (var i = 0; i < result.length; i++) {
                console.log('result[' + i + '].doc_others.email : ' + result[i]._doc.others.sEmail);
                console.log('req.user.email : ' + req.user.email);

                // 그 사람이 올린 것 중 신청자가 나일 경우
                if (result[i]._doc.others.sEmail === req.user.email) {

                    // 나한테 신청한 사람 정보
                    var data = {
                        'email': result[i]._doc.email,
                        'teamname': result[i]._doc.teamname,
                        'others': result[i]._doc.others //내가 등록한 매칭 정보
                    };
                    console.log(i + '번째 data.others : ');
                    console.dir(data.others);
                    console.log('j : ' + j);
                    eventData[j++] = data;
                    console.log('eventData: ');
                    console.log(eventData);
                }
            }

            console.log('00000000000000000000000000000000000000000000');
            console.log('eventData : ');
            console.log(eventData);

            var teamname = eventData[sSameEmailIndex].teamname;
            console.log('teamname : ' + teamname);

            var findEventDate = eventData[sSameEmailIndex].others.sEvent_date;
            console.log('findEventDate : ' + findEventDate);

            var findEventTime = eventData[sSameEmailIndex].others.sEvent_time;

            console.log('findEventTime ; ' + findEventTime);

            dbm.MatchModel.update(
                {email: otherEmail, "others.sEvent_date": findEventDate, "others.sEvent_time": findEventTime},
                {$set: {match_success: match}}, function (err, result) {
                    if (err) {
                        console.log(err.message);
                    } else {
                        console.dir(result);
                    }
                });

        });
        res.redirect('/chatroommessage');
    });
	
	
    router.route('/chat').get(function(req, res){
        console.log('/chat 패스 get으로 요청됨.');

        
        if (!req.user) {
            console.log('사용자 인증 안된 상태임.');
            res.redirect('/login');
        }else{
         
         profile_photo = req.user.profile_img;         
         if(profile_img == null)
            profile_img = req.user.profile_img;
         if(profile_img != req.user.profile_img)
            profile_photo = profile_img;
            
            
            var dbm = require('../database/database');
            console.log('database 모듈 가져옴');
            
            var eventData = new Array();
            var j = 0;

            // 나한테 매칭 신청한 팀 찾기
            dbm.MatchModel.find({email : {"$ne" : req.user.email}} ,function (err, result) {
                for (var i = 0; i < result.length; i++) {
                    if (result[i]._doc.others.sEmail === req.user.email) {
                        var data = {
                            'email' : req.user.email, // 나
                            'otherEmail': result[i]._doc.email//상대팀
                        };
                        eventData[j++] = data;
                    }
                }

                // 내가 매칭 신청한 팀 찾기
                dbm.MatchModel.find({email : req.user.email} ,function (err, result) {
                    for (var i = 0; i < result.length; i++) {
                        if (result[i]._doc.email === req.user.email) {
                            var data = {
                                'email': result[i]._doc.email,//나
                                'otherEmail': result[i]._doc.others.sEmail // 상대팀
                            };
                            eventData[j++] = data;
                        }
                    }
                    var user_context = {
                        'email': req.user.email,
                        'password': req.user.password,
                        'teamname': req.user.teamname,
                        'gender': req.user.gender,
                        'age': req.user.age,
                        'region': req.user.region,
                        'move': req.user.move,
                        'nofteam': req.user.nofteam,
                        'career_year': req.user.career_year,
                        'career_count': req.user.career_count,
                        'introteam': req.user.introteam,
                        'profile_img': profile_photo,
                        'event_data': eventData
                    };
                    console.dir(eventData);
                    res.render('chat.ejs', user_context);
                });
            });

        };
    });
    
    router.route('/chatroomchat').post(function(req, res){
		console.log('/chatroomchat 패스 post 요청됨.');
        
		var event = {
			'email':req.body.email || req.query.email,
			'otherEmail': req.body.otherEmail || req.query.otherEmail,
            'match_success': req.body.match_success || req.query.match_success,
            'otherTeamname': req.body.otherTeamname || req.query.otherTeamname
		}
		
		console.dir(event);
		res.redirect('/chat');
		
	});
	
	router.route('/chatappointment').get(function(req, res){
        console.log('/chatappointment 패스 get으로 요청됨.');

        
        if (!req.user) {
            console.log('사용자 인증 안된 상태임.');
            res.redirect('/login');
        }else{
         profile_photo = req.user.profile_img;			
			if(profile_img == null)
				profile_img = req.user.profile_img;
			if(profile_img != req.user.profile_img)
				profile_photo = profile_img;

			
			var user_context = {
				'email':req.user.email, 
				'password':req.user.password, 
				'teamname':req.user.teamname, 
				'gender':req.user.gender, 
				'age':req.user.age,
				'region':req.user.region,
				'add':req.user.add,
				'move':req.user.move,
				'nofteam':req.user.nofteam,
				'career_year':req.user.career_year,
				'career_count':req.user.career_count,
				'introteam':req.user.introteam,
				'profile_img':profile_photo
			};      
         
         
            res.render('chat_appointment.ejs', user_context);
        }
    });
	
	router.route('/chatappointment').post(function(req, res) {
       console.log('/chatappointment 패스 post 요청됨');
      
		var event = {
			'email':req.user.email,
			'teamname':req.user.teamname,
			'event_date': req.user.event_date,
			'event_time': req.user.event_time,
			'event_region': req.user.event_region,
			'event_add': req.user.event_add,
			'event_nofteam': req.user.event_nofteam
		};
            
      
		event.event_date = req.body.event_date || req.query.event_date;
		event.event_time = req.body.event_time || req.query.event_time;
		event.event_region = req.body.region || req.query.region;
		event.event_add = req.body.add || req.query.add;
		event.event_nofteam = req.body.event_nofteam || req.query.event_nofteam;
		

		if(!event.add){		//도로명주소 없는 경우 지번 주소
			event.add = req.body.add2 || req.query.add2;
		}else{		
			var addr = [];
			addr= event.add.split(' ');

			if(addr[0] == '제주특별자치도'){
				event.add = [addr[1], addr[2]];
			}else
				event.add = [addr[0], addr[1]];
		}

        console.dir(event);
      
		var event_appointment = new dbm.AppointmentModel(event);
 
        event_appointment.save(function (err, data) {
          if (err) {// TODO handle the error
              console.log("appointment save error");
          }
          console.log('New appointment inserted');
        });
	   
      res.redirect('/chat');
   })
    

    
    // ===== 메뉴
	
	
	//경기 검색
    router.route('/mainsearch').get(function(req, res){
        console.log('/main_search 패스 get 요청됨.');
		
		if(!req.user){
			console.log('사용자 인증 안된 상태임.');
			res.redirect('/login');
		}
		else{
			
			profile_photo = req.user.profile_img;			
			if(profile_img == null)
				profile_img = req.user.profile_img;
			if(profile_img != req.user.profile_img)
				profile_photo = profile_img;

			
			var user_context = {
				'email':req.user.email, 
				'password':req.user.password, 
				'teamname':req.user.teamname, 
				'gender':req.user.gender, 
				'age':req.user.age,
				'region':req.user.region,
				'add':req.user.add,
				'move':req.user.move,
				'nofteam':req.user.nofteam,
				'career_year':req.user.career_year,
				'career_count':req.user.career_count,
				'introteam':req.user.introteam,
				'profile_img':profile_photo
			};
			
        	res.render('main_search.ejs', user_context);
		}
    });
	
	
	router.route('/mainsearch').post(function(req, res){
		console.log('/mainsearch 패스 post 요청됨.');

		event_search = {
			'teamname':req.body.search_team || req.query.search_team,
			'add': req.body.add || req.query.add,
			'gender': req.body.gender || req.query.gender,
			'age': req.body.age || req.query.age,
	//     'event_date': req.body.event_date || req.query.event_date,
			'event_time': req.body.event_time || req.query.event_time,
			'event_day': req.body.event_day || req.query.event_day
		};

		res.redirect('/mainsearchresult');
      
   });
   
      
      
	router.route('/mainsearchresult').get(function(req, res){	   
		console.log('/mainsearchresult 패스 get 요청됨.');

		if(!req.user){
			console.log('사용자 인증 안된 상태임.');
			res.redirect('/login');
		}
		else{
			profile_photo = req.user.profile_img;         
			if(profile_img == null)
				profile_img = req.user.profile_img;
			if(profile_img != req.user.profile_img)
				profile_photo = profile_img;


			var eventData = new Array();			
				
			console.dir(event_search);
			
			if(event_search.teamname == 'none')
				delete event_search.teamname;
			if(event_search.add[0] && event_search.add[1]){
				if(event_search.add[0] == 'none')
                	delete event_search.add;	
			}
			if(event_search.gender == 0)
				delete event_search.gender;
			if(event_search.age == 0)
				delete event_search.age;
			if(event_search.event_time == 'none')
				delete event_search.event_time;
			if(event_search.event_day == 'none')
				delete event_search.event_day;
			
			var search = [];
			
			if(event_search){
				for(var key in event_search) {
					var testobj = new Object();
					var testkey = event_search;
					console.log(key)
					testobj[key] = event_search[key];
					search.push(testobj);
				}
			}
			
			search.push({email : {"$ne" : req.user.email}});
			
			console.dir(search);

			dbm.ApplicationModel.find({$and: search}, function (err, result) {
				for (var i = 0; i < result.length; i++) {
					var data = {
						'email' : result[i]._doc.email, 
						'teamname' : result[i]._doc.teamname,
						'career_year' : result[i]._doc.career_year,
						'career_count' : result[i]._doc.career_count,
						'region' : result[i]._doc.region,
						'add' : result[i]._doc.add,
						'move' : result[i]._doc.move,
						'age' : result[i]._doc.age,	
						'gender' : result[i]._doc.gender,
						'event_date' : result[i]._doc.event_date,
						'event_time' : result[i]._doc.event_time,
						'event_day' : result[i]._doc.event_day,
						'mention' : result[i]._doc.mention,	
						'nofteam' : result[i]._doc.nofteam,
						'geoLng' : result[i]._doc.geoLng,
						'geoLat' : result[i]._doc.geoLat,
						'created_month' : result[i]._doc.created_month,
						'created_day' : result[i]._doc.created_day,
						'application_number' : result[i]._doc.application_number
					};
					eventData[i] = data;
				}			
				
				var user_context = {
					'email':req.user.email, 
					'password':req.user.password, 
					'teamname':req.user.teamname, 
					'gender':req.user.gender, 
					'age':req.user.age,
					'region':req.user.region,
					'add':req.user.add,
					'move':req.user.move,
					'nofteam':req.user.nofteam,
					'career_year':req.user.career_year,
					'career_count':req.user.career_count,
					'introteam':req.user.introteam,
					'profile_img':profile_photo,
					'event_data':eventData
				};
				
				console.dir(eventData);

				res.render('main_search_result.ejs', user_context);                
			});
        }
    });
	
	
	router.route('/mainsearchresult').post(function(req, res){
        console.log('/mainsearchresult 패스 post 요청됨.');
		
        var others = {
            'sEmail': req.body.sEmail,
            'sTeamname': req.body.sTeamname,
            'sAdd': [req.body.sAdd0, req.body.sAdd1],
            'sRegion': req.body.sRegion,
            'sMove' : req.body.sMove,
            'sAge': req.body.sAge,
            'sGender': req.body.sGender,
            'sEvent_date': req.body.sDate,
            'sEvent_time': req.body.sTime,
            'sEvent_day' : req.body.sDay,
            'sMention': req.body.sMention,
            'sCreatedMonth' : req.body.sCreatedMonth,
            'sCreatedDay' : req.body.sCreatedDay,
            'sGeoLng': req.body.sGeoLng,
            'sGeoLat': req.body.sGeoLat,
            'sNofteam': req.body.sNofteam,
            'sScore': 0,
            'sReceivedReview' : 0,
            'sReceivedReviewComment' : '',
            'sReviewDate' : ''
        }

        var event = {
            'email': req.user.email,
            'password': req.user.password,
            'teamname': req.user.teamname,
            'add' : req.user.add,
            'region': req.user.region,
            'move': req.user.move,
            'gender': req.user.gender,
            'age': req.user.age,
            'nofteam': req.user.nofteam,
            'career_year': req.user.career_year,
            'career_count': req.user.career_count,
            'introteam': req.user.introteam,
            'profile_img': profile_photo,
            'others':others
        };

        var event_match = new dbm.MatchModel(event);

        event_match.save(function (err, data) {
            if (err) {// TODO handle the error
                console.log("match save error");
                console.log('err : ' + err);
                console.log('data : ' + data);
            }
            console.log('New match inserted');
            console.log('data : ' + data);
        });

        res.redirect('/');
    });

    //경기 스케쥴
	router.route('/teamschedule').get(function(req, res) {
        console.log('/teamschedule 패스 get 요청됨.');

        if (!req.user) {
            console.log('사용자 인증 안된 상태임.');
            res.redirect('/');
        } else {
            profile_photo = req.user.profile_img;
            if (profile_img == null)
                profile_img = req.user.profile_img;
            if (profile_img != req.user.profile_img)
                profile_photo = profile_img;

            var eventData = new Array(); // 나한테 신청한
            var j = 0;

            // 나한테 매칭 신청한 팀 찾기
            dbm.MatchModel.find({email : {"$ne" : req.user.email}} ,function (err, result) {
                for (var i = 0; i < result.length; i++) {
                    if (result[i]._doc.others.sEmail === req.user.email) {
                        var data = {
                            'email': result[i]._doc.email, //상대팀
                            'teamname': result[i]._doc.teamname, //상대팀
                            // others내엔 경기정보
                            'event_date': result[i]._doc.others.sEvent_date,
                            'event_time': result[i]._doc.others.sEvent_time,
                            'event_add' : result[i]._doc.others.sAdd,
                            'event_region': result[i]._doc.others.sRegion,
                            'event_nofteam': result[i]._doc.nofteam, // 상대팀
                            'match_success': result[i]._doc.match_success,
                            'score': result[i]._doc.score, // 상대팀의 이 경기 score
                            'review': result[i]._doc.received_review, // 상대팀이 이 경기에서 받은 review
                            'sScore' : result[i]._doc.others.sScore, // 내 이 경기 스코어
                            'sReceivedReview': result[i]._doc.others.sReceivedReview, // 내가 이 경기에서 받은 리뷰
                            'sReceivedReviewComment': result[i]._doc.others.sReceivedReviewComment,
                            'sReviewDate' : result[i]._doc.others.sReviewDate
                        };
                        eventData[j++] = data;
                    }
                }

                // 내가 매칭 신청한 팀 찾기
                dbm.MatchModel.find({email : req.user.email} ,function (err, result) {
                    for (var i = 0; i < result.length; i++) {
                        if (result[i]._doc.email === req.user.email) {
                            var data = {
                                'email': result[i]._doc.email,//나
                                'teamname': result[i]._doc.teamname, //나
                                'otherEmail': result[i]._doc.others.sEmail, // 상대팀
                                'otherTeam' : result[i]._doc.others.sTeamname, // 상대팀
                                // others내엔 경기정보
                                'event_date': result[i]._doc.others.sEvent_date,
                                'event_time': result[i]._doc.others.sEvent_time,
                                'event_add': result[i]._doc.others.sAdd,
                                'event_region': result[i]._doc.others.sRegion,
                                'other_nofteam': result[i]._doc.others.sNofteam, // 상대팀
                                'match_success': result[i]._doc.match_success,
                                'score': result[i]._doc.score, // 이 경기 내 score
                                'review': result[i]._doc.received_review, // 내가 이 경기에서 받은 리뷰
                                'sScore' : result[i]._doc.others.sScore, // 상대팀의 이 경기 score
                                'sReceivedReview': result[i]._doc.others.sReceivedReview, // 상대팀의 이 경기에서 받은 리뷰
                                'sReceivedReviewComment': result[i]._doc.others.sReceivedReviewComment, // 상대팀의 이 경기에서 받은 리뷰 코멘트
                                'sReviewDate' : result[i]._doc.others.sReviewDate // 상대팀의 이 경기에서 받은 평점 기록된 날짜
                            };
                            eventData[j++] = data;
                        }
                    }

                    var user_context = {
                        'email': req.user.email,
                        'password': req.user.password,
                        'teamname': req.user.teamname,
                        'add' : req.user.add,
                        'region': req.user.region,
                        'move': req.user.move,
                        'gender': req.user.gender,
                        'age': req.user.age,
                        'nofteam': req.user.nofteam,
                        'career_year': req.user.career_year,
                        'career_count': req.user.career_count,
                        'introteam': req.user.introteam,
                        'profile_img': profile_photo,
                        'event_data':eventData
                    }; // user_context
                    console.dir(eventData);
                    res.render('team_schedule.ejs', user_context);

                }); // dbm event_data2 end
            }); // dbm event_data end
        } // 인증 else문 end
    });
    
	router.route('/teamschedule').post(function(req, res) {
        console.log('/teamschedule 패스 post 요청됨.');

        // score 입력
        var scoreCallTeamEmail = req.body.callTeamEmail;
        var scoreReceiveTeamEmail = req.body.receiveTeamEmail;
        var scoreEventDate = req.body.event_date;
        var scoreEventTime = req.body.event_time;
        // 신청이 온 경우 firstScore : 내 점수 / 내가 신청한 경우 firstScore : 남 점수
        var firstScore = req.body.firstScore;
        var secondScore = req.body.secondScore;

        // 대기 상태에서 취소
        var cCallTeamEmail = req.body.cCallTeamEmail;
        var cReceiveTeamEmail = req.body.cReceiveTeamEmail;
        var cEvent_date = req.body.cEvent_date;
        var cEvent_time = req.body.cEvent_time;

        // 내게 신청한 매칭일 경우 scoreReceiveTeamEmail 비어있음
        // 나로 변경
        if(!scoreReceiveTeamEmail){
            scoreReceiveTeamEmail = req.user.email;

            var k;
            k = firstScore;
            firstScore = secondScore;
            secondScore = k;
        }

        console.log('scoreCallTeamEmail : ' + scoreCallTeamEmail);

        if(scoreCallTeamEmail) {

            // score update
            dbm.MatchModel.update(
                {email: scoreCallTeamEmail, "others.sEvent_date": scoreEventDate, "others.sEvent_time": scoreEventTime},
                {$set: {score: firstScore, "others.sScore": secondScore}}, function (err, result) {
                    if (err) {
                        console.log(err.message);
                    } else {
                        console.dir(result);
                    }
                });

        } // match 신청 cancel
        else {



        }

        res.redirect('/teamschedule');
    });

	// 상대팀 리뷰하기
    router.route('/teamreview').get(function(req, res){
        console.log('/teamreview 패스 get 요청됨.');

        if(!req.user){
            console.log('사용자 인증 안된 상태임.');
            res.redirect('/');
        }
        else{
            profile_photo = req.user.profile_img;
            if(profile_img == null)
                profile_img = req.user.profile_img;
            if(profile_img != req.user.profile_img)
                profile_photo = profile_img;

            var reviewerTeamEmail = req.user.email;
            var reviewedTeamEmail = req.query.reviewedTeamEmail;
            var eventDate = req.query.eventDate;
            var eventTime = req.query.eventTime;

            console.log('reviewerTeamEmail : ' + reviewerTeamEmail);
            console.log('reviewedTeamEmail : ' + reviewedTeamEmail);
            console.log('eventDate : ' + eventDate);
            console.log('eventTime : ' + eventTime);

            var eventData = {
                'reviewerTeamEmail' : reviewerTeamEmail,
                'reviewedTeamEmail' : reviewedTeamEmail,
                'eventDate' : eventDate,
                'eventTime' : eventTime
            }

            var user_context = {
                'email': req.user.email,
                'password': req.user.password,
                'teamname': req.user.teamname,
                'add' : req.user.add,
                'region': req.user.region,
                'move': req.user.move,
                'gender': req.user.gender,
                'age': req.user.age,
                'nofteam': req.user.nofteam,
                'career_year': req.user.career_year,
                'career_count': req.user.career_count,
                'introteam': req.user.introteam,
                'profile_img': profile_photo,
                'event_data':eventData
            };
            res.render('team_review.ejs', user_context);
        }
    });

    router.route('/teamreview').post(function(req, res){
        console.log('/teamreview 패스 post 요청됨');

        var email = req.user.email;
        var reviewDate = req.body.reviewDate; // 리뷰 등록 날짜
        var reviewedTeamEmail= req.body.reviewedTeamEmail;
        var rating = req.body.rating;
        var review_comment = req.body.review_comment;
        var eventDate = req.body.eventDate; // 경기 날짜
        var eventTime = req.body.eventTime; // 경기 시간

        console.log('email : ' + email);
        console.log('reviewDate : ' + reviewDate);
        console.log('reviewedTeamEmail : ' + reviewedTeamEmail);
        console.log('rating : ' + rating);
        console.log('review_comment : ' + review_comment);
        console.log('eventDate : ' + eventDate);
        console.log('eventTime : ' + eventTime);
		
        // 내가 신청했을 때
        dbm.MatchModel.update(
            {email: email, "others.sEmail":reviewedTeamEmail, "others.sEvent_date": eventDate, "others.sEvent_time": eventTime},
            {$set: {"others.sReceivedReview": rating, "others.sReceivedReviewComment": review_comment, "others.sReviewDate": reviewDate}}, function (err, result) {
                if (err) {
                    console.log(err.message);
                } else {
                    console.log('내가 신청했을 때 updated');
                    console.dir(result);
                }
            });

        // 내가 신청받았을 때
        dbm.MatchModel.update(
            {email: reviewedTeamEmail, "others.sEmail": email, "others.sEvent_date": eventDate, "others.sEvent_time": eventTime},
            {$set: {received_review: rating, received_review_comment: review_comment, review_date: reviewDate}}, function (err, result) {
                if (err) {
                    console.log(err.message);
                } else {
                    console.log('내가 신청받았을 때 updated');
                    console.dir(result);
                }
            });

        res.redirect('/teamschedule');
    });
    
    // 우리팀이 받은 리뷰
    router.route('/teamreceivedreview').get(function(req, res) {
        console.log('/teamreceivedreview 패스 get 요청됨');

        if (!req.user) {
            console.log('사용자 인증 안된 상태임.');
            res.redirect('/');
        } else {
            profile_photo = req.user.profile_img;
            if (profile_img == null)
                profile_img = req.user.profile_img;
            if (profile_img != req.user.profile_img)
                profile_photo = profile_img;


            var eventData = new Array();
            var j = 0;

            // 나한테 매칭 신청한 팀에서 내가 받은 리뷰 찾기
            dbm.MatchModel.find({email : {"$ne" : req.user.email}} ,function (err, result) {
                for (var i = 0; i < result.length; i++) {
                    if ((result[i]._doc.others.sEmail === req.user.email) &&
                        (result[i]._doc.others.sReviewDate)) {
                        var data = {
                            'otherEmail': result[i]._doc.email, // 상대팀 정보
                            'otherTeam' : result[i]._doc.teamname, // 상대팀 정보
                            'review_date': result[i]._doc.others.sReviewDate, // 내가 리뷰 받은 날짜
                            'rating': result[i]._doc.others.sReceivedReview, // 내가 받은 리뷰
                            'review_comment': result[i]._doc.others.sReceivedReviewComment // 내가 받은 리뷰 코멘트
                        };
                        eventData[j++] = data;
                    }
                }

                // 내가 매칭 신청한 팀에서 내가 받은 리뷰 찾기
                dbm.MatchModel.find({email : req.user.email} ,function (err, result) {
                    for (var i = 0; i < result.length; i++) {
                        if ((result[i]._doc.email === req.user.email) &&
                            (result[i]._doc.review_date)) {
                            var data = {
                                'otherEmail': result[i]._doc.others.sEmail, // 상대팀 정보
                                'otherTeam' : result[i]._doc.others.sTeamname, // 상대팀 정보
                                'review_date': result[i]._doc.review_date,
                                'rating': result[i]._doc.received_review,
                                'review_comment': result[i]._doc.received_review_comment
                            };
                            eventData[j++] = data;
                        }
                    }

                    var user_context = {
                        'email': req.user.email,
                        'password': req.user.password,
                        'teamname': req.user.teamname,
                        'gender': req.user.gender,
                        'age': req.user.age,
                        'region': req.user.region,
                        'move': req.user.move,
                        'nofteam': req.user.nofteam,
                        'career_year': req.user.career_year,
                        'career_count': req.user.career_count,
                        'introteam': req.user.introteam,
                        'profile_img': profile_photo,
                        'event_data': eventData
                    };
                    console.dir(eventData);
                    res.render('team_received_review.ejs', user_context);
                });
            });
        }
    });
    
    
    //매칭 등록
    router.route('/matchapplication').get(function(req, res){
        console.log('/match_application 패스 get 요청됨.');
        
        if (!req.user) {
            console.log('사용자 인증 안된 상태임.');
            res.redirect('/login');
        }else{
			
			profile_photo = req.user.profile_img;			
			if(profile_img == null)
				profile_img = req.user.profile_img;
			if(profile_img != req.user.profile_img)
				profile_photo = profile_img;

			
			var user_context = {
				'email':req.user.email, 
				'password':req.user.password, 
				'teamname':req.user.teamname, 
				'gender':req.user.gender, 
				'age':req.user.age,
				'region':req.user.region,
				'move':req.user.move,
				'nofteam':req.user.nofteam,
				'career_year':req.user.career_year,
				'career_count':req.user.career_count,
				'introteam':req.user.introteam,
				'profile_img':profile_photo
			};
			
             res.render('match_application_form.ejs', user_context);
        }       
    });
	
	router.route('/matchapplication').post(function(req, res){
        console.log('/match_application 패스 post 요청됨.');


        var event = {
            'email': req.user.email,
            'teamname': req.user.teamname,
			'career_year':req.user.career_year,
			'career_count':req.user.career_count,
            'region': req.body.region || req.query.region,
			'add':req.body.add ||req.query.add,
            'place' : req.body.place || req.query.place,
            'move' : req.body.move || req.query.move,
            'age': req.body.age || req.query.age,
            'gender': req.body.gender || req.query.gender,
            'event_date': req.body.event_date || req.query.event_date,
            'event_time': req.body.event_time || req.query.event_time,
            'event_day' : req.body.event_day || req.query.event_day,
            'mention': req.body.mention || req.query.mention,
            'geoLng': req.body.resultLng || req.query.resultLng,
            'geoLat': req.body.resultLat || req.query.resultLat,
            'nofteam' : req.user.nofteam || req.user.nofteam,
			'application_number' : an,
			'eventYear_forExpire': 0,
			'eventMonth_forExpire': 0,
			'eventDate_forExpire' : 0,
        };
		
		var week = new Array('일', '월', '화', '수', '목', '금', '토');
        var whatDay = new Date(event.event_date);
        event.event_day = week[whatDay.getDay()];
		
		event.eventYear_forExpire = event.event_date.substring(0,4);
		event.eventMonth_forExpire = event.event_date.substring(5,7);
		event.eventDate_forExpire = event.event_date.substring(8,10);
		
		if(!event.add){		//도로명주소 없는 경우 지번 주소
			event.add = req.body.add2 || req.query.add2;
		}else{		
			var addr = [];
			addr= event.add.split(' ');

			if(addr[0] == '제주특별자치도'){
				event.add = [addr[1], addr[2]];
			}else
				event.add = [addr[0], addr[1]];
		}

        console.dir(event);


        var event_application = new dbm.ApplicationModel(event);

        event_application.save(function (err, data) {
            if (err) {// TODO handle the error
                console.log("application save error");
            }
            console.log('New application inserted');
        });
		
		an+=1;

        res.redirect('/');

    });
	
	
	router.route('/mymatch').get(function(req, res){
		console.log('/mymatch 패스 get 요청됨.');
        
        if (!req.user) {
            console.log('사용자 인증 안된 상태임.');
            res.redirect('/login');
        }else{			
			profile_photo = req.user.profile_img;			
			if(profile_img == null)
				profile_img = req.user.profile_img;
			if(profile_img != req.user.profile_img)
				profile_photo = profile_img;
			
			
			var eventData = new Array();	

			dbm.ApplicationModel.find({email : req.user.email} ,function (err, result) {				
				for(var i = 0 ; i < result.length ; i++) {
					var data = {
						'email' : result[i]._doc.email, 
						'teamname' : result[i]._doc.teamname,
						'career_year' : result[i]._doc.career_year,
						'career_count' : result[i]._doc.career_count,
						'region' : result[i]._doc.region,
						'add' : result[i]._doc.add,
						'move' : result[i]._doc.move,
						'age' : result[i]._doc.age,	
						'gender' : result[i]._doc.gender,
						'event_date' : result[i]._doc.event_date,
						'event_time' : result[i]._doc.event_time,
						'event_day' : result[i]._doc.event_day,
						'mention' : result[i]._doc.mention,	
						'nofteam' : result[i]._doc.nofteam,
						'geoLng' : result[i]._doc.geoLng,
						'geoLat' : result[i]._doc.geoLat,
						'created_month' : result[i]._doc.created_month,
						'created_day' : result[i]._doc.created_day,
						'application_number' : result[i]._doc.application_number
					};				
					eventData[i] = data;
				}
										
				var user_context = {
					'email':req.user.email, 
					'password':req.user.password, 
					'teamname':req.user.teamname, 
					'gender':req.user.gender, 
					'age':req.user.age,
					'region':req.user.region,
					'add':req.user.add,
					'move':req.user.move,
					'nofteam':req.user.nofteam,
					'career_year':req.user.career_year,
					'career_count':req.user.career_count,
					'introteam':req.user.introteam,
					'profile_img':profile_photo,
					'event_data':eventData
				};
				
							
            	res.render('my_match.ejs', user_context);
			
			});
        }
	});	
	
	router.route('/mymatch').post(function(req, res){
		console.log('/mymatch 패스 post 요청함.');
		
		selectone = {
			user:req.body.user || req.query.user,
			date:req.body.date || req.query.date,
			time:req.body.time || req.query.time,
			region:req.body.event_region || req.query.event_region,
			application_number:req.body.event_application_number || req.query.event_application_number
		};
		
		
		if(req.body.opt == 'del'){
			if(dbm.MatchModel.find({'others.sApplicationNumber':selectone.application_number})){
				console.log('=== Match deleted ===');
				dbm.MatchModel.remove({'others.sApplicationNumber':selectone.application_number}, 1);
			}
			
			setTimeout(function(){
				dbm.ApplicationModel.remove({'application_number':selectone.application_number}, true);
				console.log('=== Application deleted ===');
				res.redirect('/mymatch');		
			},500);
			
		}else if(req.body.opt == 'mod')
			res.redirect('/matchapplicationedit');
		else
			res.redirect('/mymatch');		
	});
	
	
	
	router.route('/matchapplicationedit').get(function(req, res){
		console.log('/matchapplicationedit 패스 get 요청됨.');
        
        if (!req.user) {
            console.log('사용자 인증 안된 상태임.');
            res.redirect('/login');
        }else{
			
			
			profile_photo = req.user.profile_img;			
			if(profile_img == null)
				profile_img = req.user.profile_img;
			if(profile_img != req.user.profile_img)
				profile_photo = profile_img;
		
			
			var eventData = new Array();			
			
			
			console.dir(selectone);

			dbm.ApplicationModel.find({$and:[{email:selectone.user}, /*{event_date:selectone.date}, {event_time:selectone.time}, {region:selectone.region}, */{application_number:selectone.application_number}]}, function (err, result) {
				for(var i = 0 ; i < result.length ; i++) {
					var data = {
						'email' : result[i]._doc.email, 
						'teamname' : result[i]._doc.teamname,
						'career_year' : result[i]._doc.career_year,
						'career_count' : result[i]._doc.career_count,
						'region' : result[i]._doc.region,
						'add' : result[i]._doc.add,
						'move' : result[i]._doc.move,
						'age' : result[i]._doc.age,	
						'gender' : result[i]._doc.gender,
						'event_date' : result[i]._doc.event_date,
						'event_time' : result[i]._doc.event_time,
						'event_day' : result[i]._doc.event_day,
						'mention' : result[i]._doc.mention,	
						'nofteam' : result[i]._doc.nofteam,
						'geoLng' : result[i]._doc.geoLng,
						'geoLat' : result[i]._doc.geoLat,
						'created_month' : result[i]._doc.created_month,
						'created_day' : result[i]._doc.created_day,
						'application_number' : result[i]._doc.application_number
					};				
					eventData[i] = data;
				}
				
				
				
				var user_context = {
					'email':req.user.email, 
					'password':req.user.password, 
					'teamname':req.user.teamname, 
					'gender':req.user.gender, 
					'age':req.user.age,
					'region':req.user.region,
					'add':req.user.add,
					'move':req.user.move,
					'nofteam':req.user.nofteam,
					'career_year':req.user.career_year,
					'career_count':req.user.career_count,
					'introteam':req.user.introteam,
					'profile_img':profile_photo,
					'event_data':eventData
				};
				
				
				console.dir(user_context);
				
							
            	res.render('match_application_edit.ejs', user_context);
			
			});
        }
	});
	

	router.route('/matchapplicationedit').post(function(req, res){
		console.log('/matchapplicationedit 패스 post 요청됨.');
	
		var update = {
			'add': req.body.add || req.query.add,
			'region' : req.body.region || req.query.region,
			'move' : req.body.move || req.query.move,
			'age': req.body.age || req.query.age,
			'gender': req.body.gender || req.query.gender,
			'event_date': req.body.event_date || req.query.event_date,
			'event_time': req.body.event_time || req.query.event_time,
			'mention': req.body.mention || req.query.mention,
			'geoLat': req.body.geoLat || req.query.geoLat,
			'geoLng': req.body.geoLng || req.query.geoLng,
			'nofteam': req.body.nofteam || req.query.nofteam,
			'application_number': selectone.application_number
		};
		
		if(!event.add){		//도로명주소 없는 경우 지번 주소
			event.add = req.body.add2 || req.query.add2;
		}else{		
			var addr = [];
			addr= event.add.split(' ');

			if(addr[0] == '제주특별자치도'){
				event.add = [addr[1], addr[2]];
			}else
				event.add = [addr[0], addr[1]];
		}
		
		if(update.add[0] == undefined)
			delete update.add;
		if(update.region == undefined)
			delete update.region;
		if(update.move == undefined)
			delete update.move;
		if(update.age == undefined)
			delete update.age;
		if(update.gender == undefined)
			delete update.gender;
		if(update.event_date == undefined)
			delete update.event_date;
		if(update.event_time == undefined)
			delete update.event_time;
		if(update.mention == undefined)
			delete update.mention;
		if(update.geoLat == undefined)
			delete update.geoLat;
		if(update.geoLng == undefined)
			delete update.geoLng;
		if(update.nofteam == undefined)
			delete update.nofteam;
			
		console.dir(update);
		
		dbm.ApplicationModel.updateOne({application_number:selectone.application_number},  {$set: update}, function(err, res) {
    		if (err) throw err;
    		console.log("=== Application updated ===");
  		});
		
		res.redirect('/mymatch');
	});
	
	
	
	router.route('/contact').get(function(req, res){
		console.log('/contact 패스 get 요청됨.');
		
		
		if(!req.user){
			console.log('사용자 인증 안된 상태임.');
			res.redirect('/login');
		}
		else{
			
			profile_photo = req.user.profile_img;			
			if(profile_img == null)
				profile_img = req.user.profile_img;
			if(profile_img != req.user.profile_img)
				profile_photo = profile_img;

			
			var user_context = {
				'email':req.user.email, 
				'password':req.user.password, 
				'teamname':req.user.teamname, 
				'gender':req.user.gender, 
				'age':req.user.age,
				'region':req.user.region,
				'add':req.user.add,
				'move':req.user.move,
				'nofteam':req.user.nofteam,
				'career_year':req.user.career_year,
				'career_count':req.user.career_count,
				'introteam':req.user.introteam,
				'profile_img':profile_photo
			};
			
        	res.render('contact.ejs', user_context);
		}
	});
	
	
    // 로그아웃
    router.route('/logout').get(function(req, res) {
        console.log('/logout 패스 get 요청됨.');
		profile_img=null;
		profile_photo=null;
        req.logout();
        res.redirect('/login');
    });

};