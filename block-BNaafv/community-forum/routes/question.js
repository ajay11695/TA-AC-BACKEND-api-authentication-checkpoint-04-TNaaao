var express = require('express');
var router = express.Router();
var Question=require('../models/Question')
var Answer=require('../models/Answer')
var User=require('../models/User')
var Comment=require('../models/Comment')
var auth=require('../middleware/auth')
var slug=require('slug')

/* GET question list */
router.get('/',async function(req, res, next) {
  try {
    var question=await Question.find({}).populate('author','username')
     res.json(question)
  } catch (error) {
    next(error)
  }
});

/* GET question list */
router.get('/tags',async function(req, res, next) {
    try {
      var tags=await Question.distinct('tags')
       res.json(tags)
    } catch (error) {
      next(error)
    }
  });

router.use(auth.varifyToken)

// create question
router.post('/',async function(req, res, next) {
    try {
        req.body.author=req.user.userId
        req.body.tags=req.body.tags.split(',')
      var data=await Question.create(req.body)
      var question=await data.populate('author','username')
       res.json({question})
    } catch (error) {
      next(error)
    }
  });

//   update question
router.put('/:questionId',async function(req, res, next) {
    try {
        if(req.body.title){
            req.body.slug=slug(req.body.title,'-')
        }
        if(req.body.tags){
            req.body.tags=req.body.tags.split(',')
        }
      var data=await Question.findByIdAndUpdate(req.params.questionId,req.body,{new:true})
      var question=await data.populate('author','username')
       res.json({question})
    } catch (error) {
      next(error)
    }
  });


//   delete question
router.delete('/:slug',async function(req, res, next) {
    try {

      var question=await Question.findOneAndDelete(req.params.slug)
      let comment = await Comment.deleteMany({ questionId: question._id })
      res.json({ message: `succesfully deleted`, question })
    } catch (error) {
      next(error)
    }
  });

  //upvote questions
router.post('/:questionId/upvote', async (req, res, next) => {
    let questionId = req.params.questionId
    let loggedInUser = req.user.userId

    let ques = await Question.findById(questionId)
    if (ques.upvoted.includes(loggedInUser)) {
        let question = await Question.findByIdAndUpdate(questionId, { $pull: { upvoted: loggedInUser } }, { new: true })
        question.upvote = question.upvoted.length
        question.save()
        return res.json({ question })
    }

    let question = await Question.findByIdAndUpdate(questionId, { $push: { upvoted: loggedInUser } }, { new: true })
    question.upvote = question.upvoted.length
    question.save()
    return res.json({ question })
})

//comment question
router.post('/:questionId/comment', async (req, res, next) => {
    let questionId = req.params.questionId
    req.body.questionId = questionId
    let comment = await Comment.create(req.body)
    let question = await Question.findByIdAndUpdate(questionId, { $push: { commentId: comment._id } }, { new: true }).populate('commentId')
    res.json({ question })
})

//   get answer list
  router.get('/:questionId/answer',async function(req, res, next) {
    try {
      var answer=await Answer.find({questionId: req.params.questionId}).populate('author','username')
       res.json({answer})
    } catch (error) {
      next(error)
    }
  });





//   add answer
  router.post('/:questionId/answer',async function(req, res, next) {
    try {
        req.body.author=req.user.userId
        req.body.questionId=req.params.questionId
      var data=await Answer.create(req.body)
      var answer=await data.populate('author','username')
      var question=await Question.findByIdAndUpdate(req.params.questionId,{$push:{answerId:answer._id}},{new:true})
       res.json({answer})
    } catch (error) {
      next(error)
    }
  });

  //   update answer 
  router.put('/answer/:answer',async function(req, res, next) {
    try {
      var answer =await Answer.findByIdAndUpdate(req.params.answer,req.body,{new:true})
       res.json({answer})
    } catch (error) {
      next(error)
    }
  });

  //   delete answer 
  router.delete('/answer/:answer',async function(req, res, next) {
    try {
      var answer =await Answer.findByIdAndDelete(req.params.answer)
      let comment = await Comment.deleteMany({ answerId: answer._id })
      res.json({ message: `succesfully deleted`, answer })
    } catch (error) {
      next(error)
    }
  });

  //upvote answer
router.post('/answer/:answer/upvote/', async (req, res, next) => {
    let answerId = req.params.answer
    let loggedInUser = req.users.userId

    let ans = await Answers.findById(answerId)
    if (ans.upvoted.includes(loggedInUser)) {
        let answer = await Answer.findByIdAndUpdate(answerId, { $pull: { upvoted: loggedInUser } }, { new: true })
        answer.upvote = answer.upvoted.length
        answer.save()
        return res.json({ answer })
    }

    let answer = await Answer.findByIdAndUpdate(answerId, { $push: { upvoted: loggedInUser } }, { new: true })
    answer.upvote = answer.upvoted.length
    answer.save()
    return res.json({ answer })
})

//comment answer
router.post('/answer/:answer/comment', async (req, res, next) => {
    let answerId = req.params.answer
    req.body.answerId = answerId
    let comment = await Comment.create(req.body)
    let answer = await Answer.findByIdAndUpdate(answerId, { $push: { commentId: comment._id } }, { new: true }).populate('commentId')
    res.json({ answer })
})


module.exports = router;