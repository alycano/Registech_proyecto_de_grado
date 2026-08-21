const areasRepository = require('../repository/areasRepository')

exports.getAllAreas = async () => {
    return await areasRepository.findAll()
}
