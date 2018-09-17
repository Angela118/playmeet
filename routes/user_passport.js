/*
 * 라우팅 함수 정의
 */

module.exports = function(router, passport, upload) {
	console.log('=== Server open! ===')
    console.log('user_passport 호출됨.');

    var an = 0;
    var dbm = require('../database/database');
    console.log('database 모듈 가져옴');

    var imgi=0;
    var profile_img=[];
    var profile_photo;

    /*	var event_search = {
            'teamname':'',
            'add': '',
            'gender': '',
            'age': '',
            'event_time': '',
            'event_day': ''
        };	*/
    var sn=0;

    var selectone = {
        user:'',
        date:'',
        time:'',
        region:''
    };
	
	// 오늘
	var nowDate = new Date();
	var dd = nowDate.getDate();
	var mm = nowDate.getMonth()+1; //January is 0!
	var yyyy = nowDate.getFullYear();
	var hh = nowDate.getHours();

	if(dd<10) {
		dd='0'+dd
	}

	if(mm<10) {
		mm='0'+mm
	}

	var today = yyyy + '-' + mm + '-' + dd; // 오늘 날짜


    //홈 화면, 추천
    router.route('/').get(function(req, res) {
        console.log('/ 패스 get 요청됨.');

        // 인증 안된 경우
        if (!req.user) {
            console.log('사용자 인증 안된 상태임.');
            res.redirect('/login');
        } else {
			
            // expire
            dbm.ApplicationModel.remove({'eventYear_forExpire':{$lt:yyyy}}, function(err){
                if(err) throw err
            });

            dbm.ApplicationModel.remove({'eventMonth_forExpire':{$lt:mm}}, function(err){
                if(err) throw err
            });
            
			dbm.ApplicationModel.remove({$and:[{'eventMonth_forExpire':mm}, {'eventDate_forExpire':{$lt:dd}}]}, function(err){
				if(err) throw err
			});

			dbm.ApplicationModel.remove({$and:[{'eventMonth_forExpire':mm}, {'eventDate_forExpire':dd}, {'event_time':{$lt:hh}}]}, function(err){
				if(err) throw err
			});
            
            var fs = require('fs');

            const Json2csvParser = require('json2csv').Parser;
            const fields = ['email', 'age', 'gender', 'nofteam', 'career_year', 'career_count', 'geoLng', 'geoLat', 'perRating', 'allRating',/*여기까지*/ 'teamname', 'region', 'add', 'move', 'event_date', 'event_time', 'event_day', 'event_day', 'mention', 'created_month', 'created_day', 'application_number', 'eventYear_forExpire', 'eventMonth_forExpire', 'eventDate_forExpire'];

            const eventData = [];

            var userdata = {
                'email':req.user.email,
                'age':req.user.age,
                'gender':req.user.gender,
                'nofteam':req.user.nofteam,
                'career_year':req.user.career_year,
                'career_count':req.user.career_count,
                'geoLng':req.user.geoLng,
                'geoLat':req.user.geoLat,
				'perRating':5.00, 
				'allRating':5.00
            };
            var j=1;
            eventData[0] = userdata;


            dbm.ApplicationModel.find({$and:[{email:{$ne:req.user.email}}, {match:0}]}, function (err, result) {
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
                        'application_number' : result[i]._doc.application_number,
                        'allRating': '',
						'perRating': ''
                    };
                    eventData[j] = data;
                    j+=1;
                }


                var repeatFunction = function (a, callback) {				
                   dbm.MatchModel.find({$or: [{"email": eventData[a].email}, {"others.sEmail": eventData[a].email}]}, function (err, result) {
                        var sum = 0;
                        var count = 0;

                        for (var b = 0; b < result.length; b++) {
                            if ((result[b]._doc.email === eventData[a].email) && (result[b]._doc.others.sEmail !== eventData[a].email)) {

                                // if(parseInt(result[b]._doc.received_review) != 0) {
                                if((result[b]._doc.review_date) != 0) {
                                    sum += parseInt(result[b]._doc.received_review);
                                    count++;
                                }
                            } else if ((result[b]._doc.email !== eventData[a].email) && (result[b]._doc.others.sEmail === eventData[a].email)) {
                                // if(parseInt(result[b]._doc.others.sReceivedReview) != 0){
                                if((result[b]._doc.others.sReviewDate) != 0){
                                    sum += parseInt(result[b]._doc.others.sReceivedReview);
                                    count++;
                                }
                            } else {
                                continue;
                            }
                        } //end in match for

                        var aver;

                        if(count == 0) {
                            aver = "리뷰없음";
                        }else {
                            aver = (sum / count).toFixed(2);
                        }
					   
                        eventData[a]['allRating'] = aver;


					   
					   
						dbm.MatchModel.find({$or:[ {$and:[{"email": eventData[a].email}, {"others.sEmail":req.user.email}]}, {$and:[{"others.sEmail": eventData[a].email}, {"email":req.user.email}]}]}, function (err, result) {
							var sum = 0;
							var count = 0;

							for (var b = 0; b < result.length; b++) {
								if ((result[b]._doc.email === eventData[a].email) && (result[b]._doc.others.sEmail !== eventData[a].email)) {

									// if(parseInt(result[b]._doc.received_review) != 0) {
									if((result[b]._doc.review_date) != 0) {
										sum += parseInt(result[b]._doc.received_review);
										count++;
									}
								} else if ((result[b]._doc.email !== eventData[a].email) && (result[b]._doc.others.sEmail === eventData[a].email)) {
									// if(parseInt(result[b]._doc.others.sReceivedReview) != 0){
									if((result[b]._doc.others.sReviewDate) != 0){
										sum += parseInt(result[b]._doc.others.sReceivedReview);
										count++;
									}
								} else {
									continue;
								}
							} //end in match for

							var aver;

							if(count == 0) {
								aver = "리뷰없음";
							}else {
								aver = (sum / count).toFixed(2);
							}
							
							eventData[a]['perRating'] = aver;


							
							if(a>=eventData.length-1) {	
								const json2csvParser = new Json2csvParser({ fields });
								const csv = json2csvParser.parse(eventData);

								fs.writeFile('recEvent.csv', csv, 'utf8', function(err){
									if(err) throw err
									console.log('File Write.');
								});

								callback();
							}else{
								repeatFunction(a+1, callback);
							}
							
							
						});
					   
					   /*

                        if(a>=eventData.length-1) {
                            const json2csvParser = new Json2csvParser({ fields });
                            const csv = json2csvParser.parse(eventData);

                            fs.writeFile('recEvent.csv', csv, 'utf8', function(err){
                                if(err) throw err
                                console.log('File Write.');
                            });

                            callback();	
                        }else{
                            repeatFunction(a+1, callback);
                        }
                    });
					
					*/
					
					
					});
				}


				if(eventData.length>1){
					repeatFunction(1, function () {
						console.log('=== rep is done ===');
					});
				}else{
					const json2csvParser = new Json2csvParser({ fields });
					const csv = json2csvParser.parse(eventData);

					fs.writeFile('recEvent.csv', csv, 'utf8', function(err){
						if(err) throw err
						console.log('File Write.');
					});
				}                

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
            profile_photo = req.user.profile_img;
            if(profile_img.length > 0){
                for(var i=0; i<profile_img.length; i++){
                    if(profile_img[i][0] == req.user.email)
                        profile_photo = profile_img[i][1];
                }
            } else{
                profile_img[imgi] = [req.user.email, req.user.profile_img];
            }


            var csvf = require('csvtojson');

            csvf()
                .fromFile('recOutput.csv')
                .then(function(output){
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
            }
            console.log('New match inserted');
        });

        dbm.ApplicationModel.update({email:others.sEmail, application_number:others.sApplicationNumber}, {$set: {match: 1}}, function (err, result) {
            if(err) throw err
            else console.log('ApplicationModel update in main');

            res.redirect('/');
        });

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
            profile_photo = req.user.profile_img;
            if(profile_img.length > 0){
                for(var i=0; i<profile_img.length; i++){
                    if(profile_img[i][0] == req.user.email)
                        profile_photo = profile_img[i][1];
                }
            } else{
                profile_img[imgi] = [req.user.email, req.user.profile_img];
            }

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

            dbm.UserModel.update({email: req.user.email}, {$set: {'img_flag':1}}, function (err, res) {
                if(err) throw err
            });

            res.render('upload_img.ejs', user_context);
        }
    });


    router.route('/uploadimg').post(upload.array('photo'), function(req, res){
        try{
            var files = req.files;

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


            console.log('프로필 사진 업로드 성공!');
    //        console.log('현재 파일 정보 : ' + originalname + ', ' + filename + ', ' + mimetype + ', ' + size);


            if(filename)
                profile_img[imgi] = [req.user.email, filename];
            else
                profile_img[imgi] = [req.user.email, req.user.profile_img];


            dbm.UserModel.update({email: req.user.email}, {$set: {'profile_img':profile_img[imgi][1]}}, function (err, result) {
                if(err) throw err
            });

            imgi++;


            console.log("======== set profile image =======");

        }catch(err){
            console.dir(err.stack);
        }

        setTimeout(function(){
            if(req.user.img_flag == 0){	//from 회원가입
                dbm.UserModel.update({email: req.user.email}, {$set: {'img_flag':1}}, function (err, res) {
                    if(err) throw err
                });
                res.redirect('/login');
            }
            else{	//from 프로필 이미지 수정
                res.redirect('/');
            }
        }, 500);
    });



    // 프로필 
    router.route('/teamprofile').get(function(req, res) {
        console.log('/teamprofile 패스 get 요청됨.');

        // 인증 안된 경우
        if (!req.user) {
            console.log('사용자 인증 안된 상태임.');
            res.redirect('/login');
        } else {
            profile_photo = req.user.profile_img;
            if(profile_img.length > 0){
                for(var i=0; i<profile_img.length; i++){
                    if(profile_img[i][0] == req.user.email)
                        profile_photo = profile_img[i][1];
                }
            } else{
                profile_img[imgi] = [req.user.email, req.user.profile_img];
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
                'profile_img':profile_photo
            };
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
            if(profile_img.length > 0){
                for(var i=0; i<profile_img.length; i++){
                    if(profile_img[i][0] == req.user.email)
                        profile_photo = profile_img[i][1];
                }
            } else{
                profile_img[imgi] = [req.user.email, req.user.profile_img];
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
                'profile_img':profile_photo
            };

            console.log('사용자 인증된 상태임.');
            res.render('team_profile_edit.ejs', user_context);
        }

    })

    router.route('/teamprofileedit').post(function(req, res) {
        console.log('/teamprofileedit 패스 post 요청됨.');

        profile_photo = req.user.profile_img;
        if(profile_img.length > 0){
            for(var i=0; i<profile_img.length; i++){
                if(profile_img[i][0] == req.user.email)
                    profile_photo = profile_img[i][1];
            }
        } else{
            profile_img[imgi] = [req.user.email, req.user.profile_img];
        }

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
            if(!event.add){		//도로명주소 없는 경우 지번 주소
                event.add = req.body.add2 || req.query.add2;
            }
            var addr = [];
            addr= event.add.split(' ');

            if(addr[0] == '제주특별자치도'){
                event.add = [addr[1], addr[2]];
            }else
                event.add = [addr[0], addr[1]];

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

        console.log('=== Profile edit ===');

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



    //===== 채팅
    router.route('/chatroomchat').get(function(req, res){
        console.log('/chatrooomchat 패스 get으로 요청됨.');

        if (!req.user) {
            console.log('사용자 인증 안된 상태임.');
            res.redirect('/');
        }else{
            profile_photo = req.user.profile_img;
            if(profile_img.length > 0){
                for(var i=0; i<profile_img.length; i++){
                    if(profile_img[i][0] == req.user.email)
                        profile_photo = profile_img[i][1];
                }
            } else{
                profile_img[imgi] = [req.user.email, req.user.profile_img];
            }

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
                            'otherTeamname': result[i]._doc.teamname, // 상대팀 팀명
                            'event_date': result[i]._doc.others.sEvent_date,
                            'event_time': result[i]._doc.others.sEvent_time,
                            'event_add': result[i]._doc.others.sAdd,
                            'event_region': result[i]._doc.others.sRegion,
                            'nofteam': result[i]._doc.others.sNofteam,
                            'other_nofteam': result[i]._doc.nofteam, // 상대팀
                            'other_review_date': result[i]._doc.review_date,
                            'application_number': result[i]._doc.others.sApplicationNumber
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
                                'otherTeamname': result[i]._doc.others.sTeamname, // 상대팀 팀명
                                'event_date': result[i]._doc.others.sEvent_date,
                                'event_time': result[i]._doc.others.sEvent_time,
                                'event_add': result[i]._doc.others.sAdd,
                                'event_region': result[i]._doc.others.sRegion,
                                'nofteam': result[i]._doc.nofteam,
                                'other_nofteam': result[i]._doc.others.sNofteam, // 상대팀
                                'other_review_date': result[i]._doc.others.sReviewDate,
                                'application_number': result[i]._doc.others.sApplicationNumber
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

    // chat get역할 함
    router.route('/chatroomchat').post(function(req, res){
        console.log('/chatroomchat 패스 post 요청됨.');

        var otherEmail = req.body.otherEmail || req.query.otherEmail;
        var application_number = req.body.application_number;
        var data;

        dbm.MatchModel.find({"others.sApplicationNumber" : application_number} ,function (err, result) {
            for (var i = 0; i < result.length; i++) {
                // 나한테 매칭 신청한 팀 찾기
                if (result[i]._doc.others.sEmail === req.user.email) {
                    data = {
                        'email': req.user.email, // 나
                        'otherEmail': result[i]._doc.email, //상대팀
                        'match_success': result[i]._doc.match_success, //매치 수락 여부
                        'otherTeamname': result[i]._doc.teamname, // 상대팀 팀명
                        'event_date': result[i]._doc.others.sEvent_date,
                        'event_time': result[i]._doc.others.sEvent_time,
                        'event_add': result[i]._doc.others.sAdd,
                        'event_region': result[i]._doc.others.sRegion,
                        'nofteam': result[i]._doc.others.sNofteam,
                        'other_nofteam': result[i]._doc.nofteam, // 상대팀
                        'other_review_date': result[i]._doc.review_date,
                        'application_number': result[i]._doc.others.sApplicationNumber
                    };
                } else if (result[i]._doc.email === req.user.email) {
                    data = {
                        'email': result[i]._doc.email,//나
                        'otherEmail': result[i]._doc.others.sEmail, // 상대팀
                        'match_success': result[i]._doc.match_success, //매치 수락 여부
                        'otherTeamname': result[i]._doc.others.sTeamname, // 상대팀 팀명
                        'event_date': result[i]._doc.others.sEvent_date,
                        'event_time': result[i]._doc.others.sEvent_time,
                        'event_add': result[i]._doc.others.sAdd,
                        'event_region': result[i]._doc.others.sRegion,
                        'nofteam': result[i]._doc.nofteam,
                        'other_nofteam': result[i]._doc.others.sNofteam, // 상대팀
                        'other_review_date': result[i]._doc.others.sReviewDate,
                        'application_number': result[i]._doc.others.sApplicationNumber
                    };
                }
            }

            dbm.UserModel.find({email:otherEmail}, function (err, result) {
                for (var i = 0; i < result.length; i++) {
                    data['otherProfile'] = result[i]._doc.profile_img;
                }
                console.log('otherProfile : ' + data.otherProfile);

                if (!req.user) {
                    console.log('사용자 인증 안된 상태임.');
                    res.redirect('/login');
                }else{
                    profile_photo = req.user.profile_img;
                    if(profile_img.length > 0){
                        for(var i=0; i<profile_img.length; i++){
                            if(profile_img[i][0] == req.user.email)
                                profile_photo = profile_img[i][1];
                        }
                    } else{
                        profile_img[imgi] = [req.user.email, req.user.profile_img];
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
                        'event_data': data
                    };
                    console.log('profile_img : ' + user_context.profile_img);
                    console.dir(data);
                    res.render('chat.ejs', user_context);
                }
            });
        });
    });

    router.route('/chat').post(function(req, res){
        console.log('/chat 패스 post 요청됨.');

        var email = req.user.email;
        var otherEmail = req.body.otherEmail;
        var event_date = req.body.event_date;
        var event_time = req.body.event_time;
        var application_number = req.body.application_number;

        console.log('email : ' + email);
        console.log('otherEmail : ' + otherEmail);
        console.log('event_date : ' + event_date);
        console.log('event_time : ' + event_time);
        console.log('application_number : ' + application_number);

        // application number 찾아서 삭제해야 함
        dbm.ApplicationModel.update({application_number:application_number}, {$set: {match:0}}, function (err) {
                if(err) throw err;
                console.log('application db match:1->0 update');
            }
        )

        setTimeout(function () {
            dbm.MatchModel.remove({$and:[
                    {$or:[
                            {$and:[
                                    {"email":email}, {"others.sEmail":otherEmail}
                                ]},
                            {$and:[
                                    {"email":otherEmail}, {"others.sEmail":email}
                                ]},
                        ]},
                    {$and:[
                            {"others.sEvent_date":event_date}, {"others.sEvent_time":event_time}
                        ]}
                ]}, function(err){
                if(err) throw err
                console.log('=== Match Deleted ===');

                res.redirect('/chatroomchat');
            });
        }, 500);
    })

    router.route('/chatroommessage').get(function(req, res){
        console.log('/chatroommessage 패스 get으로 요청됨.');

        if (!req.user) {
            console.log('사용자 인증 안된 상태임.');
            res.redirect('/');
        }else {
            profile_photo = req.user.profile_img;
            if(profile_img.length > 0){
                for(var i=0; i<profile_img.length; i++){
                    if(profile_img[i][0] == req.user.email)
                        profile_photo = profile_img[i][1];
                }
            } else{
                profile_img[imgi] = [req.user.email, req.user.profile_img];
            }

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
                        'career_year': result[i]._doc.career_year,
                        'career_count': result[i]._doc.career_count,
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
                        'application_number': result[i]._doc.application_number,
                        'allRating': '',
                        'others': result[i]._doc.others //내가 등록한 매칭 정보
                    };
                    eventData[j++] = data;
                }
            }
            var repeatFunction = function (a, callback) {

                console.log(a + '번째 eventData[' + a + '].email : ' + eventData[a].email);
                console.log(a + '번째 eventData[' + a + '].region : ' + eventData[a].region);

                dbm.MatchModel.find({$or: [{"email": eventData[a].email}, {"others.sEmail": eventData[a].email}]}, function (err, result) {
                    var sum = 0;
                    var count = 0;

                    for (var b = 0; b < result.length; b++) {
                        console.log('a : ' + a + ', b : ' + b);
                        console.log('result.length : ' + result.length);

                        if ((result[b]._doc.email === eventData[a].email) && (result[b]._doc.others.sEmail !== eventData[a].email)) {
                            console.log('if');
                            console.log('result[' + b + ']._doc.review_date : ' + result[b]._doc.review_date);

                            // if(parseInt(result[b]._doc.received_review) != 0) {
                            if ((result[b]._doc.review_date) != 0) {
                                sum += parseInt(result[b]._doc.received_review);
                                count++;
                            }
                            console.log('if count : ' + count);

                        } else if ((result[b]._doc.email !== eventData[a].email) && (result[b]._doc.others.sEmail === eventData[a].email)) {
                            console.log('elseif');
                            console.log('result[' + b + ']._doc.review_date : ' + result[b]._doc.review_date);

                            // if(parseInt(result[b]._doc.others.sReceivedReview) != 0){
                            if ((result[b]._doc.others.sReviewDate) != 0) {
                                sum += parseInt(result[b]._doc.others.sReceivedReview);
                                count++;
                            }
                            console.log('elseif count : ' + count);

                        } else {
                            console.log('else');
                            continue;
                        }
                        console.log('*********');
                    } //end in match for

                    console.log('sum : ' + sum);
                    console.log('count : ' + count);

                    var aver;

                    if (count == 0) {
                        aver = "리뷰없음";
                    } else {
                        aver = (sum / count).toFixed(2);
                    }

                    console.log('aver : ' + aver);
                    eventData[a]['allRating'] = aver;

                    console.log('eventData[a]["allRating"] : ' + eventData[a]['allRating']);


                    if (a >= eventData.length - 1) {
                        console.log('##eventData[' + a + ']["allRating"] : ' + eventData[a]['allRating']);
                        callback();
                    } else {
                        console.log('!!eventData[' + a + ']["allRating"] : ' + eventData[a]['allRating']);
                        repeatFunction(a + 1, callback);
                    }

                }); //andmatch2
            } //repeatfunction 정의


            if(eventData.length>0) {
                repeatFunction(0, function () {
                    console.log('done');

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
                        'sSameEmailIndex': sSameEmailIndex // email 중복시 index
                    };
                    console.log(eventData);

                    console.log('chatmessagepostend----------------------');
                    res.render('message.ejs', user_context);
                    console.log('render 함');


                }); //end repeatfunction
            } else {
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
                    'sSameEmailIndex': sSameEmailIndex // email 중복시 index
                };
                console.log(eventData);

                console.log('chatmessagepostend----------------------');
                res.render('message.ejs', user_context);
                console.log('render 함');
            }
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

            var teamname = eventData[sSameEmailIndex].teamname;
            console.log('teamname : ' + teamname);

            var findEventDate = eventData[sSameEmailIndex].others.sEvent_date;
            console.log('findEventDate : ' + findEventDate);

            var findEventTime = eventData[sSameEmailIndex].others.sEvent_time;

            console.log('findEventTime ; ' + findEventTime);


            if(match == 1){
                dbm.MatchModel.update(
                    {email: otherEmail, "others.sEvent_date": findEventDate, "others.sEvent_time": findEventTime},
                    {$set: {match_success: match}}, function (err, result) {
                        if (err) {
                            console.log(err.message);
                        } else {
                            console.dir(result);
                        }
                        res.redirect('/chatroommessage');
                    });
            }else if(match == 2){
                dbm.ApplicationModel.update({email:req.user.email, event_date:findEventDate, event_time:findEventTime}, {$set: {match:0}}, function (err, result) {
                    if(err) throw err;
                    dbm.MatchModel.remove({email: otherEmail, "others.sEvent_date": findEventDate, "others.sEvent_time": findEventTime}, function(err){
                        if(err) throw err
                        res.redirect('/chatroommessage');
                    });
                });
            }
        });
    });


    router.route('/chatappointment').get(function(req, res){
        console.log('/chatappointment 패스 get으로 요청됨.');

        if (!req.user) {
            console.log('사용자 인증 안된 상태임.');
            res.redirect('/login');
        }else{
            profile_photo = req.user.profile_img;
            if(profile_img.length > 0){
                for(var i=0; i<profile_img.length; i++){
                    if(profile_img[i][0] == req.user.email)
                        profile_photo = profile_img[i][1];
                }
            } else{
                profile_img[imgi] = [req.user.email, req.user.profile_img];
            }

            var email = req.query.email;
            var otherEmail = req.query.otherEmail;
            var otherTeamname = req.query.otherTeamname;
            var event_date = req.query.event_date;
            var event_time = req.query.event_time;
            var application_number = req.query.application_number;

            dbm.MatchModel.find({$and:[
                    {$or:[
                            {$and:[
                                    {"email":email}, {"others.sEmail":otherEmail}
                                ]},
                            {$and:[
                                    {"email":otherEmail}, {"others.sEmail":email}
                                ]},
                        ]},
                    {$and:[
                            {"others.sApplicationNumber": application_number}
                        ]}
                ]}, function (err, result) {
                for (var i = 0; i < result.length; i++) {
                    // 신청 받음
                    if (result[i]._doc.others.sEmail === req.user.email) {
                        var data = {
                            'otherEmail': otherEmail, // 상대팀
                            'otherTeamname': otherTeamname,
                            'event_date': event_date,
                            'event_time': event_time,
                            'event_add': result[i]._doc.others.sAdd,
                            'event_region': result[i]._doc.others.sRegion,
                            'nofteam': result[i]._doc.others.sNofteam,
                            'other_nofteam': result[i]._doc.nofteam, // 상대팀
                            'match_success': result[i]._doc.match_success,
                            'application_number': application_number,
                            'flag': 0
                        }
                        // 신청함
                    } else if (result[i]._doc.email === req.user.email) {
                        var data = {
                            'otherEmail': otherEmail,
                            'otherTeamname': otherTeamname,
                            'event_date': event_date,
                            'event_time': event_time,
                            'event_add': result[i]._doc.others.sAdd,
                            'event_region': result[i]._doc.others.sRegion,
                            'nofteam': result[i]._doc.nofteam,
                            'other_nofteam': result[i]._doc.others.sNofteam, // 상대팀
                            'match_success': result[i]._doc.match_success,
                            'application_number': application_number,
                            'flag': 1
                        }
                    }
                } //endfor

                console.dir(data);

                var user_context = {
                    'email': req.user.email,
                    'password': req.user.password,
                    'teamname': req.user.teamname,
                    'gender': req.user.gender,
                    'age': req.user.age,
                    'region': req.user.region,
                    'add': req.user.add,
                    'move': req.user.move,
                    'nofteam': req.user.nofteam,
                    'career_year': req.user.career_year,
                    'career_count': req.user.career_count,
                    'introteam': req.user.introteam,
                    'profile_img': profile_photo,
                    'event_data': data
                };

                res.render('chat_appointment.ejs', user_context);
            });
        }
    });

    //얘도 chatappointment post & chat get 역할
    router.route('/chatappointment').post(function(req, res) {
        console.log('/chatappointment 패스 post 요청됨');

        var email = req.user.email;
        var otherEmail = req.body.otherEmail;
        var preEvent_date = req.body.preEvent_date;
        var preEvent_time = req.body.preEvent_time;
        var application_number = req.body.application_number;
        var flag = req.body.flag; // 신청한건지 받은건지 여부

        // 신청 받음 / others.sNofteam이 내꺼
        if (flag == 0) {
            var update = {
                'others.sEvent_date' : req.body.event_date || req.query.event_date,
                'others.sEvent_time' : req.body.event_time || req.query.event_time,
                'others.sRegion' : req.body.region || req.query.region,
                'others.sAdd' : req.body.add,
                'others.sNofteam' : req.body.event_nofteam || req.query.event_nofteam //우리팀꺼
            }
            // 신청함
        }else {
            var update = {
                'others.sEvent_date' : req.body.event_date || req.query.event_date,
                'others.sEvent_time' : req.body.event_time || req.query.event_time,
                'others.sRegion' : req.body.region || req.query.region,
                'others.sAdd' : req.body.add,
                'nofteam' : req.body.event_nofteam || req.query.event_nofteam //우리팀꺼
            }
        }

        console.log('1. update');
        console.dir(update);

        /* if(!update.add){		//도로명주소 없는 경우 지번 주소
             update.add = req.body.add2 || req.query.add2;
         }*/

        if(update['others.sEvent_date'] == undefined)
            delete update['others.sEvent_date'];
        if(update['others.sEvent_time'] == undefined)
            delete update['others.sEvent_time'];
        if(update['others.sRegion'] == undefined)
            delete update['others.sRegion'];
        //배열로 안바뀌면0, 1 따로보내기
        if(update['others.sAdd'] == undefined)
            delete update['others.sAdd'];

        if(flag == 0) {
            if(update['others.sNofteam'] == undefined)
                delete update['others.sNofteam'];
        }else {
            if(update.nofteam == undefined)
                delete update.nofteam;
        }

        console.log('2. update');
        console.dir(update);

        if(update['others.sAdd']) {
            var addr = [];
            addr = update['others.sAdd'].split(' ');

            if (addr[0] == '제주특별자치도') {
                update['others.sAdd'] = [addr[1], addr[2]];
            } else
                update['others.sAdd'] = [addr[0], addr[1]];
        }

        var updateFunction = function () {
            console.log('------updateFunction------');
            if(flag == 0) {
                dbm.MatchModel.update({$and:[
                            {"email":otherEmail}, {"others.sEmail":email}, {"others.sEvent_date":preEvent_date}, {"others.sEvent_time":preEvent_time}
                        ]},
                    {$set : update}, function (err) {
                        if(err) throw err
                        console.log("(flag=0)chatAppointment -> Match db updated")
                    });
                // 신청함
            }else {
                dbm.MatchModel.update({$and:[
                            {"email":email}, {"others.sEmail":otherEmail}, {"others.sEvent_date":preEvent_date}, {"others.sEvent_time":preEvent_time}
                        ]},
                    {$set : update}, function (err) {
                        if(err) throw err
                        console.log("(flag=1)chatAppointment -> Match db updated")
                    });
            }
            chatpostFunction();
        }

        var chatpostFunction = function () {
            console.log('------chatpostFunction------');
            var data;

            dbm.MatchModel.find({"others.sApplicationNumber": application_number}, function (err, result) {
                for (var i = 0; i < result.length; i++) {
                    // 나한테 매칭 신청한 팀 찾기
                    if (result[i]._doc.others.sEmail === req.user.email) {
                        data = {
                            'email': req.user.email, // 나
                            'otherEmail': result[i]._doc.email, //상대팀
                            'match_success': result[i]._doc.match_success, //매치 수락 여부
                            'otherTeamname': result[i]._doc.teamname, // 상대팀 팀명
                            'event_date': req.body.event_date || result[i]._doc.others.sEvent_date,
                            'event_time': req.body.event_time || result[i]._doc.others.sEvent_time,
                            'event_add': req.body.add || result[i]._doc.others.sAdd,
                            'event_region': req.body.region || result[i]._doc.others.sRegion,
                            'nofteam': req.body.event_nofteam || result[i]._doc.others.sNofteam,
                            'other_nofteam': result[i]._doc.nofteam, // 상대팀
                            'other_review_date': result[i]._doc.review_date,
                            'application_number': result[i]._doc.others.sApplicationNumber
                        };
                    } else if (result[i]._doc.email === req.user.email) {
                        data = {
                            'email': result[i]._doc.email,//나
                            'otherEmail': result[i]._doc.others.sEmail, // 상대팀
                            'match_success': result[i]._doc.match_success, //매치 수락 여부
                            'otherTeamname': result[i]._doc.others.sTeamname, // 상대팀 팀명
                            'event_date': req.body.event_date || result[i]._doc.others.sEvent_date,
                            'event_time': req.body.event_time || result[i]._doc.others.sEvent_time,
                            'event_add': req.body.add || result[i]._doc.others.sAdd,
                            'event_region': req.body.region || result[i]._doc.others.sRegion,
                            'nofteam': req.body.event_nofteam || result[i]._doc.nofteam,
                            'other_nofteam': result[i]._doc.others.sNofteam, // 상대팀
                            'other_review_date': result[i]._doc.others.sReviewDate,
                            'application_number': result[i]._doc.others.sApplicationNumber
                        };
                    }
                }

                if(data['event_add'] != null) {
                    var addr = [];
                    addr = data['event_add'].split(' ');

                    if (addr[0] == '제주특별자치도') {
                        data['event_add'] = [addr[1], addr[2]];
                    } else
                        data['event_add'] = [addr[0], addr[1]];
                }

                dbm.UserModel.find({email: otherEmail}, function (err, result) {
                    for (var i = 0; i < result.length; i++) {
                        data['otherProfile'] = result[i]._doc.profile_img;
                    }
                    console.log('otherProfile : ' + data.otherProfile);

                    if (!req.user) {
                        console.log('사용자 인증 안된 상태임.');
                        res.redirect('/login');
                    } else {
                        profile_photo = req.user.profile_img;
                        if (profile_img.length > 0) {
                            for (var i = 0; i < profile_img.length; i++) {
                                if (profile_img[i][0] == req.user.email)
                                    profile_photo = profile_img[i][1];
                            }
                        } else {
                            profile_img[imgi] = [req.user.email, req.user.profile_img];
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
                            'event_data': data
                        };
                        console.log('profile_img : ' + user_context.profile_img);
                        console.log(data);
                        res.render('chat.ejs', user_context);
                    }
                });
            });
        }

        updateFunction();


        /*       // 신청 받음
               if(flag == 0) {
                   dbm.MatchModel.update({$and:[
                               {"email":otherEmail}, {"others.sEmail":email}, {"others.sEvent_date":preEvent_date}, {"others.sEvent_time":preEvent_time}
                           ]},
                       {$set : update}, function (err) {
                           if(err) throw err
                           console.log("(flag=0)chatAppointment -> Match db updated")
                       });
                   // 신청함
               }else {
                   dbm.MatchModel.update({$and:[
                               {"email":email}, {"others.sEmail":otherEmail}, {"others.sEvent_date":preEvent_date}, {"others.sEvent_time":preEvent_time}
                           ]},
                       {$set : update}, function (err) {
                           if(err) throw err
                           console.log("(flag=1)chatAppointment -> Match db updated")
                       });
               }

               setTimeout(function() {
                   var data;

                   dbm.MatchModel.find({"others.sApplicationNumber" : application_number} ,function (err, result) {
                       for (var i = 0; i < result.length; i++) {
                           // 나한테 매칭 신청한 팀 찾기
                           if (result[i]._doc.others.sEmail === req.user.email) {
                               data = {
                                   'email': req.user.email, // 나
                                   'otherEmail': result[i]._doc.email, //상대팀
                                   'match_success': result[i]._doc.match_success, //매치 수락 여부
                                   'otherTeamname': result[i]._doc.teamname, // 상대팀 팀명
                                   'event_date': req.body.event_date || result[i]._doc.others.sEvent_date,
                                   'event_time': req.body.event_time || result[i]._doc.others.sEvent_time,
                                   'event_add': req.body.add || result[i]._doc.others.sAdd,
                                   'event_region': req.body.region || result[i]._doc.others.sRegion,
                                   'nofteam': req.body.event_nofteam || result[i]._doc.others.sNofteam,
                                   'other_nofteam': result[i]._doc.nofteam, // 상대팀
                                   'other_review_date': result[i]._doc.review_date,
                                   'application_number': result[i]._doc.others.sApplicationNumber
                               };
                           } else if (result[i]._doc.email === req.user.email) {
                               data = {
                                   'email': result[i]._doc.email,//나
                                   'otherEmail': result[i]._doc.others.sEmail, // 상대팀
                                   'match_success': result[i]._doc.match_success, //매치 수락 여부
                                   'otherTeamname': result[i]._doc.others.sTeamname, // 상대팀 팀명
                                   'event_date': req.body.event_date || result[i]._doc.others.sEvent_date,
                                   'event_time': req.body.event_time || result[i]._doc.others.sEvent_time,
                                   'event_add': req.body.add || result[i]._doc.others.sAdd,
                                   'event_region': req.body.region || result[i]._doc.others.sRegion,
                                   'nofteam': req.body.event_nofteam || result[i]._doc.nofteam,
                                   'other_nofteam': result[i]._doc.others.sNofteam, // 상대팀
                                   'other_review_date': result[i]._doc.others.sReviewDate,
                                   'application_number': result[i]._doc.others.sApplicationNumber
                               };
                           }
                       }

       /!*                if(data.event_add) {
                           var array = data.event_add.split(' ');
                           data.event_add[0] = array[0];
                           data.event_add[1] = array[1];
                       }*!/

                       dbm.UserModel.find({email:otherEmail}, function (err, result) {
                           for (var i = 0; i < result.length; i++) {
                               data['otherProfile'] = result[i]._doc.profile_img;
                           }
                           console.log('otherProfile : ' + data.otherProfile);

                           if (!req.user) {
                               console.log('사용자 인증 안된 상태임.');
                               res.redirect('/login');
                           } else {
                               profile_photo = req.user.profile_img;
                               if (profile_img.length > 0) {
                                   for (var i = 0; i < profile_img.length; i++) {
                                       if (profile_img[i][0] == req.user.email)
                                           profile_photo = profile_img[i][1];
                                   }
                               } else {
                                   profile_img[imgi] = [req.user.email, req.user.profile_img];
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
                                   'event_data': data
                               };
                               console.log('profile_img : ' + user_context.profile_img);
                               console.log(data);
                               res.render('chat.ejs', user_context);
                           }
                       });
                   });
               }, 600);*/
    });

    // 채팅방 내 상대팀 신고(개발자에게 메일보내기)
    router.route('/reportdeveloper').post(function(req, res){
        console.log('/reportdeveloper 패스 post 요청됨');

        var otherEmail = req.body.otherEmail;
        var otherTeamname = req.body.otherTeamname;
        var application_number = req.body.application_number;
        var report_content = req.body.report_content;

        // 보내는 사람을 '나'로 설정해야 함
        var nodemailer = require('nodemailer');
        var transporter = nodemailer.createTransport({
            service:'gmail',
            auth: {
                user : 'lsk201808@gmail.com',
                pass : 'lsklsk2018'
            }
        });

        var mailOption = {
            from : {
                name : req.user.teamname + '<' + req.user.email +'>',
                address : req.user.email
            },
            to : 'lsk201808@gmail.com',
            subject : otherTeamname + '(' + otherEmail +  ')팀 신고합니다.',
            html: '<p>' + report_content + '</p><p>application_number : ' + application_number + '</p>'
        };

        transporter.sendMail(mailOption, function(err, info) {
            if ( err ) {
                console.error('Send Mail error : ', err);
            }
            else {
                console.log('Message sent : ', info);
            }

            res.redirect('/chatroomchat');
        });

// 발신자를 원하는 이메일로 보낼 수는 있으나 인증 취약해서 스팸 분류됨..
        /*        const sendmail = require('sendmail')();

                sendmail({
                    from: 'test@finra.org',
                    to: 'lsk201808@gmail.com',
                    subject: 'Hello World',
                    html: 'Hooray NodeJS!!!'
                }, function (err, reply) {
                    console.log(err && err.stack)
                    console.dir(reply)
                })*/



        /*
        //
        const nodemailer = require('nodemailer');
        let transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: req.user.email,
                pass: req.user.password
            }
        });

        let mailOption = {
            from : {
                name : req.user.teamname,
                address : req.user.email
            },
            to : 'lsk201808@gmail.com',
            subject : otherTeamname + '(' + otherEmail +  ')팀 신고합니다.',
            html: '<p>' + report_content + '</p><p>application_number : ' + application_number + '</p>'
        };

        transporter.sendMail(mailOption, function(err, info) {
            if ( err ) {
                console.error('Send Mail error : ', err);
            }
            else {
                console.log('Message sent : ', info);
            }

            res.redirect('/chatroomchat');
        });*/

    });


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
            if(profile_img.length > 0){
                for(var i=0; i<profile_img.length; i++){
                    if(profile_img[i][0] == req.user.email)
                        profile_photo = profile_img[i][1];
                }
            } else{
                profile_img[imgi] = [req.user.email, req.user.profile_img];
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
                'profile_img':profile_photo
            };

            res.render('main_search.ejs', user_context);
        }
    });


    router.route('/mainsearch').post(function(req, res){
        console.log('/mainsearch 패스 post 요청됨.');


        var event_search = {
            'email':req.user.email,
            'search_teamname':req.body.search_team,
            'search_add0': req.body.add[0],
            'search_add1': req.body.add[1],
            'search_gender': req.body.gender,
            'search_age': req.body.age,
            'search_event_date': req.body.event_date,
            'search_event_time': req.body.event_time,
            'search_event_day': req.body.event_day,
            'search_number' : sn
        };

        var search = new dbm.SearchModel(event_search);

        search.save(function (err, data) {
            if (err) {// TODO handle the error
                console.log("search save error");
                throw err
            }
            console.log('New search inserted');
        });

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
            if(profile_img.length > 0){
                for(var i=0; i<profile_img.length; i++){
                    if(profile_img[i][0] == req.user.email)
                        profile_photo = profile_img[i][1];
                }
            } else{
                profile_img[imgi] = [req.user.email, req.user.profile_img];
            }

            dbm.SearchModel.find({$and:[{email:req.user.email}, {search_number:sn}]}, function(err, sResult){
                if(err) throw err

                var searchResult = {
                    'teamname':sResult[0]._doc.search_teamname,
                    'add':[sResult[0]._doc.search_add0, sResult[0]._doc.search_add1],
                    'gender':sResult[0]._doc.search_gender,
                    'age':sResult[0]._doc.search_age,
                    'event_date':sResult[0]._doc.search_event_date,
                    'event_time':sResult[0]._doc.search_event_time,
                    'event_day':sResult[0]._doc.search_event_day
                };

                if(searchResult.teamname == 'none')
                    delete searchResult.teamname;
                if(searchResult.add[0] && searchResult.add[1]){
                    if(searchResult.add[0] == 'none')
                        delete searchResult.add;
                }
                if(searchResult.gender == 0)
                    delete searchResult.gender;
                if(searchResult.age == 0)
                    delete searchResult.age;
                if(searchResult.event_date == '')
                    delete searchResult.event_date;
                if(searchResult.event_time == 'none')
                    delete searchResult.event_time;
                if(searchResult.event_day == 'none')
                    delete searchResult.event_day;



                var search = [];

                if(searchResult){
                    for(var key in searchResult) {
                        var testobj = new Object();
                        var testkey = searchResult;
                        testobj[key] = searchResult[key];
                        search.push(testobj);
                    }
                }

                search.push({email : {"$ne" : req.user.email}});
                search.push({match : 0});

                var eventData = new Array();
                var j = 0;

                dbm.ApplicationModel.find({$and: search}, function (err, result) {
                    for (var i = 0; i < result.length; i++) {
                        var data = {
                            'email': result[i]._doc.email,
                            'teamname': result[i]._doc.teamname,
                            'career_year': result[i]._doc.career_year,
                            'career_count': result[i]._doc.career_count,
                            'region': result[i]._doc.region,
                            'add': [result[i]._doc.add[0], result[i]._doc.add[1]],
                            'move': result[i]._doc.move,
                            'age': result[i]._doc.age,
                            'gender': result[i]._doc.gender,
                            'event_date': result[i]._doc.event_date,
                            'event_time': result[i]._doc.event_time,
                            'event_day': result[i]._doc.event_day,
                            'mention': result[i]._doc.mention,
                            'nofteam': result[i]._doc.nofteam,
                            'geoLng': result[i]._doc.geoLng,
                            'geoLat': result[i]._doc.geoLat,
                            'created_month': result[i]._doc.created_month,
                            'created_day': result[i]._doc.created_day,
                            'application_number': result[i]._doc.application_number,
                            'allRating': ''
                        };
                        eventData[j++] = data;
                    }

                    var repeatFunction = function (a, callback) {
                        dbm.MatchModel.find({$or: [{"email": eventData[a].email}, {"others.sEmail": eventData[a].email}]}, function (err, result) {
                            var sum = 0;
                            var count = 0;

                            for (var b = 0; b < result.length; b++) {
                                if ((result[b]._doc.email === eventData[a].email) && (result[b]._doc.others.sEmail !== eventData[a].email)) {
                                    // if(parseInt(result[b]._doc.received_review) != 0) {
                                    if((result[b]._doc.review_date) != 0) {
                                        sum += parseInt(result[b]._doc.received_review);
                                        count++;
                                    }
                                } else if ((result[b]._doc.email !== eventData[a].email) && (result[b]._doc.others.sEmail === eventData[a].email)) {
                                    // if(parseInt(result[b]._doc.others.sReceivedReview) != 0){
                                    if((result[b]._doc.others.sReviewDate) != 0){
                                        sum += parseInt(result[b]._doc.others.sReceivedReview);
                                        count++;
                                    }
                                } else {
                                    continue;
                                }
                            } //end in match for

                            var aver;

                            if(count == 0) {
                                aver = "리뷰없음";
                            }else {
                                aver = (sum / count).toFixed(2);
                            }
							
                            eventData[a]['allRating'] = aver;

                            if(a>=eventData.length-1) {
                                eventData.sort(function(a, b) { // 오름차순 sorting
                                    return a.event_date < b.event_date ? -1 : a.event_date > b.event_date ? 1 : 0;
                                });
                                callback();
                            }else{
                                repeatFunction(a+1, callback);
                            }

                        });
                    }

                    var user_context;

                    if(eventData.length>0) {
                        repeatFunction(0, function () {
                            console.log('done');

                            user_context = {
                                'email': req.user.email,
                                'password': req.user.password,
                                'teamname': req.user.teamname,
                                'gender': req.user.gender,
                                'age': req.user.age,
                                'region': req.user.region,
                                'add': req.user.add,
                                'move': req.user.move,
                                'nofteam': req.user.nofteam,
                                'career_year': req.user.career_year,
                                'career_count': req.user.career_count,
                                'introteam': req.user.introteam,
                                'profile_img': profile_photo,
                                'event_data': eventData
                            };
                            sn++
                            res.render('main_search_result.ejs', user_context);

                        });

                    } else{
                        user_context = {
                            'email': req.user.email,
                            'password': req.user.password,
                            'teamname': req.user.teamname,
                            'gender': req.user.gender,
                            'age': req.user.age,
                            'region': req.user.region,
                            'add': req.user.add,
                            'move': req.user.move,
                            'nofteam': req.user.nofteam,
                            'career_year': req.user.career_year,
                            'career_count': req.user.career_count,
                            'introteam': req.user.introteam,
                            'profile_img': profile_photo,
                            'event_data': eventData
                        };
                        sn++;

                        res.render('main_search_result.ejs', user_context);
                    }
                });
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
            'sApplicationNumber':req.body.sApplicationNumber,
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

        dbm.ApplicationModel.update({email:others.sEmail, application_number:others.sApplicationNumber}, {$set: {match: 1}}, function (err, result) {
            if(err) throw err;

            res.redirect('/');
        });
    });

    //경기 스케쥴
    var flag;   //처음 들어옴
    var colors=[];
    router.route('/teamcal').get(function(req, res) {
        console.log('/teamcal 패스 get 요청됨.');

        if (!req.user) {
            console.log('사용자 인증 안된 상태임.');
            res.redirect('/');
        } else {
            profile_photo = req.user.profile_img;
            if(profile_img.length > 0){
                for(var i=0; i<profile_img.length; i++){
                    if(profile_img[i][0] == req.user.email)
                        profile_photo = profile_img[i][1];
                }
            } else{
                profile_img[imgi] = [req.user.email, req.user.profile_img];
            }

            flag=0;
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
                            'review_date': result[i]._doc.review_date,
                            'sScore' : result[i]._doc.others.sScore, // 내 이 경기 스코어
                            'sReceivedReview': result[i]._doc.others.sReceivedReview, // 내가 이 경기에서 받은 리뷰
                            'sReceivedReviewComment': result[i]._doc.others.sReceivedReviewComment,
                            'sReviewDate' : result[i]._doc.others.sReviewDate,
                            'sApplicationNumber': result[i]._doc.others.sApplicationNumber
                        };
                        eventData[j++] = data;
                    }
                }

                // 내가 매칭 신청한 팀 찾기
                dbm.MatchModel.find({email: req.user.email}, function (err, result) {
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
                                'sReviewDate' : result[i]._doc.others.sReviewDate, // 상대팀의 이 경기에서 받은 평점 기록된 날짜
                                'sApplicationNumber': result[i]._doc.others.sApplicationNumber
                            };
                            eventData[j++] = data;
                        }
                    }

                    var repeatFunction = function (a, callback) {      //리뷰
                        var findEmail;
                        if(eventData[a].otherEmail){
                            findEmail = eventData[a].otherEmail;
                        }else {
                            findEmail = eventData[a].email;
                        }

                        dbm.MatchModel.find({$or: [{"email": findEmail}, {"others.sEmail": findEmail}]}, function (err, result) {
                            var sum = 0;
                            var count = 0;

                            for (var b = 0; b < result.length; b++) {
                                if ((result[b]._doc.email === findEmail) && (result[b]._doc.others.sEmail !== findEmail)) {
                                    // if(parseInt(result[b]._doc.received_review) != 0) {
                                    if((result[b]._doc.review_date) != 0) {
                                        sum += parseInt(result[b]._doc.received_review);
                                        count++;
                                    }

                                } else if ((result[b]._doc.email !== findEmail) && (result[b]._doc.others.sEmail === findEmail)) {
                                    // if(parseInt(result[b]._doc.others.sReceivedReview) != 0){
                                    if((result[b]._doc.others.sReviewDate) != 0){
                                        sum += parseInt(result[b]._doc.others.sReceivedReview);
                                        count++;
                                    }
                                } else {
                                    continue;
                                }
                            } //end in match for

                            var aver;

                            if(count == 0) {
                                aver = "리뷰없음";
                            }else {
                                aver = (sum / count).toFixed(2);
                            }

                            if(a>=eventData.length-1) {
                                callback();
                            }else{
                                repeatFunction(a+1, callback);
                            }

                        });
                    }

                    var otherEmailforProfile;

                    var profileFunction = function (a, callback) {      //상대팀 프로필 사진

                        if(eventData[a].otherEmail){
                            otherEmailforProfile = eventData[a].otherEmail;
                        }else {
                            otherEmailforProfile = eventData[a].email;
                        }

                        dbm.UserModel.find({email : otherEmailforProfile} ,function (err, result) {
                            for (var i = 0; i < result.length; i++) {
                                eventData[a]["otherProfileImg"] = result[i]._doc.profile_img;
                                eventData[a]["otherRealAdd"] = result[i]._doc.add;
                                eventData[a]["otherRealRegion"] = result[i]._doc.region;
                                eventData[a]["otherMove"] = result[i]._doc.move;
                                eventData[a]["otherAge"] = result[i]._doc.age;
                                eventData[a]["otherGender"] = result[i]._doc.gender;
                                eventData[a]["otherCareerYear"] = result[i]._doc.career_year;
                                eventData[a]["otherCareerCount"] = result[i]._doc.career_count;
                                eventData[a]["otherNofteam"] = result[i]._doc.nofteam;
                            }

                            if(a>=eventData.length-1) {
                                //오름차순 정렬
                                eventData.sort(function (a, b) {
                                    return a.event_date < b.event_date ? -1 : a.event_date > b.event_date ? 1 : 0;
                                });
                                /*
                                                                //오늘 날짜만 가까운 거부터 하기
                                                                today = new Date();
                                                                var dd = today.getDate();
                                                                var mm = today.getMonth()+1; //January is 0!
                                                                var yyyy = today.getFullYear();

                                                                if(dd<10) {
                                                                    dd='0'+dd
                                                                }

                                                                if(mm<10) {
                                                                    mm='0'+mm
                                                                }

                                                                today = yyyy + '-' + mm + '-' + dd; // 오늘 날짜
                                */
                                var n=0;

                                for(var m=0; m<eventData.length-1; m++){
                                    if(eventData[m].event_date < today){
                                        eventData[eventData.length+n] = eventData[m];
                                        n++;
                                    }else{
                                        break;
                                    }
                                }

                                for(var m=0; m<eventData.length-1; m++){
                                    eventData[m] = eventData[n+m];
                                }

                                eventData = eventData.slice(0,eventData.length-n);
                                callback();
                            }else{

                                profileFunction(a+1, callback);
                            }
                        });

                    }

                    if(eventData.length>0) {
                        //         repeatFunction(0, function () {
                        //          console.log('Rating done');

                        //         profileFunction(0, function () {
                        //            console.log('Profile done');


                        /*
                        function get_random_hexColor () {
                           var color = "#";
                           var max = Math.pow( 256, 3 );
                           var random = Math.floor( Math.random() * max ).toString( 16 );
                           var gap = 6 - random.length;

                           if (gap > 0) {
                              for(var x=0; x<gap; x++)
                                 color += "0";
                           }

                           return color + random;
                        }

                        console.log(get_random_hexColor());
                        */

                        // Calendar
                        var parr = [];
                        parr[0] = {
                            title:"\' Today \'",
                            start:"\'"+today+"\'"
                        };

                        var col = ['#7473ff', '#9933dd', '#dd3366'];

                        for(var i=0; i<eventData.length; i++){
                            if(eventData[i].otherTeam)
                                var title = "\'"+eventData[i].otherTeam+" 팀"+"\'";
                            else
                                var title = "\'"+eventData[i].teamname+" 팀"+"\'";

                            console.log(col.length%(i+1));
                            var color = "\'"+col[col.length%(i+1)]+"\'";
                            colors.push(color);

                            var description = "\'"+eventData[i].event_region+"\'";

                            if(eventData[i].event_time == 'none')
                                var start =  "\'"+eventData[i].event_date+"\'";
                            else
                                var start = "\'"+eventData[i].event_date+" "+eventData[i].event_time+":"+"00"+"\'";



                            var textColor = "\'"+ "#FFFFFF" +"\'";

                            var pData = {
                                title: title,
                                description: description,
                                backgroundColor:color,
                                textColor:textColor,
                                start: start
                            };

                            parr[i+1] = pData;
                        }

                        var pEvent = JSON.stringify(parr);

                        console.log("flag : "+flag);

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
                            'event_data':eventData,
                            'pEvent' : pEvent,
                            'flag' : flag
                        }; // user_context
                        flag++;
                        res.render('team_cal.ejs', user_context);
                        //        });

                        //      });

                    } else{
                        var parr = [];
                        parr[0] = {
                            title:"\' Today \'",
                            start:"\'"+today+"\'"
                        };
                        var pEvent = JSON.stringify(parr);

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
                            'event_data':eventData,
                            'pEvent':pEvent,
                            'flag':flag
                        }; // user_context
                        res.render('team_cal.ejs', user_context);
                    }
                }); // dbm event_data2 end
            }); // dbm event_data end
        } // 인증 else문 end
    });


    var calM,
        calOrigin;
    router.route('/teamcal').post(function(req, res){
        console.log('/teamcal 패스 post 요청됨.');

        calM = req.body.calMonth;

        if(flag==0){
            calOrigin = calM;
            flag++;
        }
        else{
            if(calOrigin == calM){
                flag++;
            }
            else{
                calOrigin = calM;
                flag++;
            }
        }

        res.redirect('/teamschedule');
    });

    router.route('/teamschedule').get(function(req, res) {
        console.log('/teamschedule 패스 get 요청됨.');

        if (!req.user) {
            console.log('사용자 인증 안된 상태임.');
            res.redirect('/');
        } else {
            if(flag==0)
                res.redirect('/teamcal');
            profile_photo = req.user.profile_img;
            if(profile_img.length > 0){
                for(var i=0; i<profile_img.length; i++){
                    if(profile_img[i][0] == req.user.email)
                        profile_photo = profile_img[i][1];
                }
            } else{
                profile_img[imgi] = [req.user.email, req.user.profile_img];
            }


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
                            'review_date': result[i]._doc.review_date,
                            'sScore' : result[i]._doc.others.sScore, // 내 이 경기 스코어
                            'sReceivedReview': result[i]._doc.others.sReceivedReview, // 내가 이 경기에서 받은 리뷰
                            'sReceivedReviewComment': result[i]._doc.others.sReceivedReviewComment,
                            'sReviewDate' : result[i]._doc.others.sReviewDate,
                            'sApplicationNumber': result[i]._doc.others.sApplicationNumber
                        };
                        eventData[j++] = data;
                    }
                }

                // 내가 매칭 신청한 팀 찾기
                dbm.MatchModel.find({email: req.user.email}, function (err, result) {
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
                                'sReviewDate' : result[i]._doc.others.sReviewDate, // 상대팀의 이 경기에서 받은 평점 기록된 날짜
                                'sApplicationNumber': result[i]._doc.others.sApplicationNumber
                            };
                            eventData[j++] = data;
                        }
                    }

                    var repeatFunction = function (a, callback) {
                        var findEmail;
                        if(eventData[a].otherEmail){
                            findEmail = eventData[a].otherEmail;
                        }else {
                            findEmail = eventData[a].email;
                        }

                        dbm.MatchModel.find({$or: [{"email": findEmail}, {"others.sEmail": findEmail}]}, function (err, result) {
                            var sum = 0;
                            var count = 0;

                            for (var b = 0; b < result.length; b++) {
                                if ((result[b]._doc.email === findEmail) && (result[b]._doc.others.sEmail !== findEmail)) {
                                    // if(parseInt(result[b]._doc.received_review) != 0) {
                                    if((result[b]._doc.review_date) != 0) {
                                        sum += parseInt(result[b]._doc.received_review);
                                        count++;
                                    }

                                } else if ((result[b]._doc.email !== findEmail) && (result[b]._doc.others.sEmail === findEmail)) {
                                    // if(parseInt(result[b]._doc.others.sReceivedReview) != 0){
                                    if((result[b]._doc.others.sReviewDate) != 0){
                                        sum += parseInt(result[b]._doc.others.sReceivedReview);
                                        count++;
                                    }
                                } else {
                                    continue;
                                }
                            } //end in match for

                            var aver;

                            if(count == 0) {
                                aver = "리뷰없음";
                            }else {
                                aver = (sum / count).toFixed(2);
                            }

                            if(a>=eventData.length-1) {
                                callback();
                            }else{
                                repeatFunction(a+1, callback);
                            }

                        });
                    }

                    var otherEmailforProfile;

                    var profileFunction = function (a, callback) {

                        if(eventData[a].otherEmail){
                            otherEmailforProfile = eventData[a].otherEmail;
                        }else {
                            otherEmailforProfile = eventData[a].email;
                        }

                        dbm.UserModel.find({email : otherEmailforProfile} ,function (err, result) {
                            for (var i = 0; i < result.length; i++) {
                                eventData[a]["otherProfileImg"] = result[i]._doc.profile_img;
                                eventData[a]["otherRealAdd"] = result[i]._doc.add;
                                eventData[a]["otherRealRegion"] = result[i]._doc.region;
                                eventData[a]["otherMove"] = result[i]._doc.move;
                                eventData[a]["otherAge"] = result[i]._doc.age;
                                eventData[a]["otherGender"] = result[i]._doc.gender;
                                eventData[a]["otherCareerYear"] = result[i]._doc.career_year;
                                eventData[a]["otherCareerCount"] = result[i]._doc.career_count;
                                eventData[a]["otherNofteam"] = result[i]._doc.nofteam;
                            }

                            if(a>=eventData.length-1) {
                                //오름차순 정렬
                                eventData.sort(function (a, b) {
                                    return a.event_date < b.event_date ? -1 : a.event_date > b.event_date ? 1 : 0;
                                });
                                /*
                                                                //오늘 날짜만 가까운 거부터 하기
                                                                today = new Date();
                                                                var dd = today.getDate();
                                                                var mm = today.getMonth()+1; //January is 0!
                                                                var yyyy = today.getFullYear();

                                                                if(dd<10) {
                                                                    dd='0'+dd
                                                                }

                                                                if(mm<10) {
                                                                    mm='0'+mm
                                                                }

                                                                today = yyyy + '-' + mm + '-' + dd; // 오늘 날짜
                                */
                                var n=0;

                                for(var m=0; m<eventData.length-1; m++){
                                    if(eventData[m].event_date < today){
                                        eventData[eventData.length+n] = eventData[m];
                                        n++;
                                    }else{
                                        break;
                                    }
                                }

                                for(var m=0; m<eventData.length-1; m++){
                                    eventData[m] = eventData[n+m];
                                }

                                eventData = eventData.slice(0,eventData.length-n);
                                callback();
                            }else{

                                profileFunction(a+1, callback);
                            }
                        });

                    }

                    if(eventData.length>0) {
                        repeatFunction(0, function () {
                            console.log('Rating done');

                            profileFunction(0, function () {
                                console.log('Profile done');


                                // Calendar
                                var parr = [];
                                parr[0] = {
                                    title:"\' Today \'",
                                    start:"\'"+today+"\'"
                                };
                                for(var i=0; i<eventData.length; i++){
                                    if(eventData[i].otherTeam)
                                        var title = "\'"+eventData[i].otherTeam+" 팀"+"\'";
                                    else
                                        var title = "\'"+eventData[i].teamname+" 팀"+"\'";

                                    var color = colors[i];
                                    var description = "\'"+eventData[i].event_region+"\'";

                                    if(eventData[i].event_time == 'none')
                                        var start =  "\'"+eventData[i].event_date+"\'";
                                    else
                                        var start = "\'"+eventData[i].event_date+" "+eventData[i].event_time+":"+"00"+"\'";


                                    var pData = {
                                        title: title,
                                        description: description,
                                        backgroundColor:color,
                                        start: start
                                    };

                                    parr[i+1] = pData;
                                }

                                var pEvent = JSON.stringify(parr);

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
                                    'event_data':eventData,
                                    'pEvent' : pEvent,
                                    'calM' : calM,
                                    'flag' : flag
                                }; // user_context
                                res.render('team_schedule.ejs', user_context);
                            });

                        });

                    } else{
                        var parr = [];
                        parr[0] = {
                            title:"\' Today \'",
                            start:"\'"+today+"\'"
                        };
                        var pEvent = JSON.stringify(parr);

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
                            'event_data':eventData,
                            'pEvent' : pEvent,
                            'calM' : calM,
                            'flag' : flag
                        }; // user_context
                        res.render('team_schedule.ejs', user_context);
                    }

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
        var cReceiveTeamName = req.body.cReceiveTeamName;
        var cReceiveTeamEmail = req.body.cReceiveTeamEmail;
        var cEvent_date = req.body.cEvent_date;
        var cEvent_time = req.body.cEvent_time;
        var cApplicationNumber = req.body.cApplicationNumber;

        // 내게 신청한 매칭일 경우 scoreReceiveTeamEmail 비어있음
        // 나로 변경
        if(!scoreReceiveTeamEmail){
            scoreReceiveTeamEmail = req.user.email;

            var k;
            k = firstScore;
            firstScore = secondScore;
            secondScore = k;
        }

        if(scoreCallTeamEmail) {
            // score update
            dbm.MatchModel.update(
                {email: scoreCallTeamEmail, "others.sEvent_date": scoreEventDate, "others.sEvent_time": scoreEventTime},
                {$set: {score: firstScore, "others.sScore": secondScore}}, function (err, result) {
                    if (err) {
						throw err
                    } else {
                        console.log('=== Score updated ===');
                    }
                });

        } // match 신청 cancel
        else {
            dbm.MatchModel.remove({email:cCallTeamEmail, 'others.sEmail':cReceiveTeamEmail, 'others.sTeamname':cReceiveTeamName, 'others.sEvent_date':cEvent_date, 'others.sEvent_time':cEvent_time}, function(err){
                if(err) throw err

                console.log('=== Match Deleted ===');
            });

            setTimeout(function(){
                dbm.ApplicationModel.update({email:cReceiveTeamEmail, application_number:cApplicationNumber}, {$set: {match: 0}}, function (err, result) {
                    if(err) throw err
                });
            }, 500);
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
            if(profile_img.length > 0){
                for(var i=0; i<profile_img.length; i++){
                    if(profile_img[i][0] == req.user.email)
                        profile_photo = profile_img[i][1];
                }
            } else{
                profile_img[imgi] = [req.user.email, req.user.profile_img];
            }

            var reviewerTeamEmail = req.user.email;
            var reviewedTeamEmail = req.query.reviewedTeamEmail;
            var eventDate = req.query.eventDate;
            var eventTime = req.query.eventTime;
			
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

        if(rating == null) {
            rating = 0;
        }


        // 내가 신청했을 때
        dbm.MatchModel.update(
            {email: email, "others.sEmail":reviewedTeamEmail, "others.sEvent_date": eventDate, "others.sEvent_time": eventTime},
            {$set: {"others.sReceivedReview": rating, "others.sReceivedReviewComment": review_comment, "others.sReviewDate": reviewDate}}, function (err, result) {
                if (err) {
                    console.log(err.message);
                } else {
                    console.log('내가 신청했을 때 updated');
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
            if(profile_img.length > 0){
                for(var i=0; i<profile_img.length; i++){
                    if(profile_img[i][0] == req.user.email)
                        profile_photo = profile_img[i][1];
                }
            } else{
                profile_img[imgi] = [req.user.email, req.user.profile_img];
            }

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
            if(profile_img.length > 0){
                for(var i=0; i<profile_img.length; i++){
                    if(profile_img[i][0] == req.user.email)
                        profile_photo = profile_img[i][1];
                }
            } else{
                profile_img[imgi] = [req.user.email, req.user.profile_img];
            }

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
            'eventDate_forExpire' : 0
        };

        var week = new Array('일', '월', '화', '수', '목', '금', '토');
        var whatDay = new Date(event.event_date);
        event.event_day = week[whatDay.getDay()];

        event.eventYear_forExpire = event.event_date.substring(0,4);
        event.eventMonth_forExpire = event.event_date.substring(5,7);
        event.eventDate_forExpire = event.event_date.substring(8,10);

        if(!event.add){		//도로명주소 없는 경우 지번 주소
            event.add = req.body.add2 || req.query.add2;
        }
        var addr = [];
        addr= event.add.split(' ');

        if(addr[0] == '제주특별자치도'){
            event.add = [addr[1], addr[2]];
        }else
            event.add = [addr[0], addr[1]];

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
            if(profile_img.length > 0){
                for(var i=0; i<profile_img.length; i++){
                    if(profile_img[i][0] == req.user.email)
                        profile_photo = profile_img[i][1];
                }
            } else{
                profile_img[imgi] = [req.user.email, req.user.profile_img];
            }

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
            if(profile_img.length > 0){
                for(var i=0; i<profile_img.length; i++){
                    if(profile_img[i][0] == req.user.email)
                        profile_photo = profile_img[i][1];
                }
            } else{
                profile_img[imgi] = [req.user.email, req.user.profile_img];
            }


            var eventData = new Array();

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
        }
        var addr = [];
        addr= event.add.split(' ');

        if(addr[0] == '제주특별자치도'){
            event.add = [addr[1], addr[2]];
        }else
            event.add = [addr[0], addr[1]];

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
            if(profile_img.length > 0){
                for(var i=0; i<profile_img.length; i++){
                    if(profile_img[i][0] == req.user.email)
                        profile_photo = profile_img[i][1];
                }
            } else{
                profile_img[imgi] = [req.user.email, req.user.profile_img];
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
                'profile_img':profile_photo
            };

            res.render('contact.ejs', user_context);
        }
    });


    // 로그아웃
    router.route('/logout').get(function(req, res) {
        console.log('/logout 패스 get 요청됨.');
        profile_photo = null;
        req.logout();
        res.redirect('/login');
    });

};
