const areasRepository = require('../repository/areasRepository')
const { sanitizarTexto } = require('../utils/sanitize')
const AppError = require('../utils/AppError')

// ======================================================
// OBTENER TODAS LAS ÁREAS
// ======================================================

exports.getAllAreas = async () => {
    return await areasRepository.findAll()
}


// ======================================================
// CREAR DEPARTAMENTO
// ======================================================

exports.crearArea = async (area) => {

    const limpia = sanitizarTexto(area, 100)

    if (!limpia || limpia.length < 2) {

        throw new AppError(
            'El nombre del departamento no es válido',
            400
        )
    }


    // Verificar que no exista otro departamento
    // con el mismo nombre.

    if (await areasRepository.exists(limpia)) {

        throw new AppError(
            'Ya existe un departamento con ese nombre',
            409
        )
    }


    await areasRepository.create(limpia)


    return {
        area: limpia
    }
}


// ======================================================
// ACTUALIZAR / RENOMBRAR DEPARTAMENTO
// ======================================================

exports.actualizarArea = async (vieja, nueva) => {

    const viejaLimpia =
        sanitizarTexto(vieja, 100)

    const nuevaLimpia =
        sanitizarTexto(nueva, 100)


    // ==================================================
    // VALIDAR NUEVO NOMBRE
    // ==================================================

    if (!nuevaLimpia || nuevaLimpia.length < 2) {

        throw new AppError(
            'El nombre del departamento no es válido',
            400
        )
    }


    // ==================================================
    // VERIFICAR QUE EXISTA EL DEPARTAMENTO ACTUAL
    // ==================================================

    if (
        !(await areasRepository.exists(viejaLimpia))
    ) {

        throw new AppError(
            'El departamento no existe',
            404
        )
    }


    // ==================================================
    // EVITAR NOMBRES DUPLICADOS
    // ==================================================

    if (
        nuevaLimpia.toLowerCase() !==
            viejaLimpia.toLowerCase() &&
        await areasRepository.exists(nuevaLimpia)
    ) {

        throw new AppError(
            'Ya existe un departamento con ese nombre',
            409
        )
    }


    // ==================================================
    // RENOMBRAR
    // ==================================================
    //
    // El repository se encarga de actualizar:
    //
    // - usuarios.area
    // - empleados.area
    // - prestamos.area
    // - areas.area
    //
    // NO modifica equipos.area.
    //
    // ==================================================

    await areasRepository.rename(
        viejaLimpia,
        nuevaLimpia
    )


    return {
        area: nuevaLimpia
    }
}


// ======================================================
// ELIMINAR DEPARTAMENTO
// ======================================================
//
// Un departamento solamente puede eliminarse cuando
// está completamente libre.
//
// Se considera ocupado si tiene:
//
// - Usuarios
// - Empleados
// - Equipos actualmente prestados
//
// Los equipos disponibles del inventario NO cuentan.
//
// ======================================================

exports.eliminarArea = async (area) => {

    const areaLimpia =
        sanitizarTexto(area, 100)


    // ==================================================
    // VALIDAR NOMBRE
    // ==================================================

    if (!areaLimpia) {

        throw new AppError(
            'El departamento no es válido',
            400
        )
    }


    // ==================================================
    // VERIFICAR EXISTENCIA
    // ==================================================

    if (
        !(await areasRepository.exists(areaLimpia))
    ) {

        throw new AppError(
            'El departamento no existe',
            404
        )
    }


    // ==================================================
    // CONSULTAR USO
    // ==================================================

    const uso =
        await areasRepository.contarUso(
            areaLimpia
        )


    const usuarios =
        Number(uso?.usuarios || 0)

    const empleados =
        Number(uso?.empleados || 0)

    const equipos =
        Number(uso?.equipos || 0)


    // ==================================================
    // NO PERMITIR ELIMINAR SI ESTÁ EN USO
    // ==================================================

    if (
        usuarios > 0 ||
        empleados > 0 ||
        equipos > 0
    ) {

        const detalles = []


        if (usuarios > 0) {

            detalles.push(
                `${usuarios} usuario(s)`
            )
        }


        if (empleados > 0) {

            detalles.push(
                `${empleados} empleado(s)`
            )
        }


        if (equipos > 0) {

            detalles.push(
                `${equipos} equipo(s)`
            )
        }


        throw new AppError(
            `No se puede eliminar el departamento porque tiene ${detalles.join(', ')} asociado(s)`,
            409
        )
    }


    // ==================================================
    // ELIMINAR
    // ==================================================

    const eliminado =
        await areasRepository.remove(
            areaLimpia
        )


    if (!eliminado) {

        throw new AppError(
            'El departamento no existe',
            404
        )
    }


    return true
}