const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users');
//     },
//     filename: (req, file, cb) => {
//         const ext = file.mimetype.split('/')[1];
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//     },
// });
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image! Please upload only images', 400), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = async (req, res, next) => {
    if (!req.file) {
        return next();
    }
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 100 })
        .toFile(`public/img/users/${req.file.filename}`);

    next();
};
const filterObj = function (obj, ...allowedFields) {
    const newObj = {};
    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) {
            newObj[el] = obj[el];
        }
    });
    return newObj;
};
exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};
exports.getAllUsers = factory.getAll(User);

exports.updateMe = catchAsync(async (req, res, next) => {
    // console.log(req.file);
    // console.log(req.body);
    //1) create error if user posts password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'This route is not for password updates. Please use /updateMyPassword',
                400
            )
        );
    }
    //2) Filter out unwanted fields names that are not allow to be updated
    // ??i???u n??y l?? c???n thi???t b???i c?? nhi???u field m?? ch??? ng?????i admin m???i c?? quy???n thay ?????i v?? d??? nh?? l?? role
    const filterBody = filterObj(req.body, 'name', 'email');
    if (req.file) filterBody.photo = req.file.filename;
    //3 Update user document
    const updateUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
        new: true,
        runValidators: true,
    });
    // C??i ??o???n n??y m??nh h??i ng?? t?? v?? t??? d??ng n?? l?? req.user.id m?? l??c truy???n body v??o th?? c?? m???i ph???n name. C?? th??? l?? do bearer token ch??ng.
    // B???i v?? khi t???t c??i authentic ??i th?? n?? l???i kh??ng ch???y ???????c n???a m?? chuy???n sang b??o no log in :))) => ch???c l?? c?? token r???i (t???i ch??a v???ng ph???n token l???m)
    res.status(200).json({
        status: 'success',
        data: {
            user: updateUser,
        },
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
        status: 'success',
        data: null,
    });
});
exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message:
            'this route is not yet defined. Please use /signup route instead',
    });
};
exports.getUser = factory.getOne(User);
// Dont update password with this V?? "save middleware" k ch???y v???i findByIdAndUpdate
exports.updateUser = factory.updateOne(User);
/*
exports.deleteUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'this route is not yet defined',
    });
};
*/
// c??i n??y l?? xo?? tr???c ti???p kh???i database c??n deleteMe tr??n th??? ch??? xo?? ng?????i d??ng khi ng?????i ???? login th??i. (t???c l?? chuy???n active sang false)
// c??n c??i n??y l?? xo?? d?????i quy???n admin
exports.deleteUser = factory.deleteOne(User);
