// ==========================================
// MATCH UNMSM - SCRIPT CORREGIDO
// PARTE 1/4: INTERFAZ Y RECOLECCIÓN DE DATOS
// ==========================================

// ===============================
// SELECTOR DINÁMICO DE BOTONES (TAGS)
// ===============================
function toggleSeleccion(boton) {
    boton.classList.toggle("selected");

    if (boton.classList.contains("selected")) {
        boton.classList.remove("bg-slate-950", "border-slate-800");
        boton.classList.add(
            "bg-gradient-to-r",
            "from-pink-500",
            "to-purple-600",
            "text-white",
            "border-transparent"
        );
    } else {
        boton.classList.add("bg-slate-950", "border-slate-800");
        boton.classList.remove(
            "bg-gradient-to-r",
            "from-pink-500",
            "to-purple-600",
            "text-white",
            "border-transparent"
        );
    }
}

// ===============================
// OBTENER VALORES SELECCIONADOS POR SECCIÓN
// ===============================
function obtenerValoresPorContenedor(idContenedor) {
    let valores = [];
    const contenedor = document.getElementById(idContenedor);
    if (contenedor) {
        contenedor.querySelectorAll(".selected").forEach(boton => {
            if (boton.dataset.val) {
                valores.push(boton.dataset.val);
            }
        });
    }
    return valores;
}

// ===============================
// LIMPIAR SELECCIÓN DE TODOS LOS BOTONES
// ===============================
function limpiarSeleccion() {
    document.querySelectorAll(".selected").forEach(boton => {
        boton.classList.remove(
            "selected",
            "bg-gradient-to-r",
            "from-pink-500",
            "to-purple-600",
            "text-white",
            "border-transparent"
        );
        boton.classList.add("bg-slate-950", "border-slate-800");
    });
}

// ===============================
// REINICIAR FORMULARIO COMPLETO
// ===============================
function reiniciarFormulario() {
    document.getElementById("matchForm").reset();
    limpiarSeleccion();
    document.getElementById("resultadoSection").classList.add("hidden");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// Asignar el evento del formulario
document.getElementById("matchForm").addEventListener("submit", registrarYCalcular);
// ==========================================
// MATCH UNMSM - SCRIPT CORREGIDO
// PARTE 2/4: REGISTRO Y ENVÍO A SUPABASE
// ==========================================

async function registrarYCalcular(event) {
    event.preventDefault();

    const boton = document.getElementById("btnGuardar");
    let textoOriginal = boton.innerHTML;

    // Bloqueo visual del botón para evitar múltiples clics
    boton.disabled = true;
    boton.innerHTML = "🔥 Procesando...";

    try {
        // Extraemos lo que el usuario es de la sección "¿Qué soy?" (grupoComoSoy)
        const comoSoy = obtenerValoresPorContenedor("grupoComoSoy");
        
        // Recopilamos todas sus preferencias en un solo array de gustos
        const gustosFisicos = obtenerValoresPorContenedor("grupoFisico");
        const gustosSubjetivos = obtenerValoresPorContenedor("grupoSubjetivo");
        const gustosComida = obtenerValoresPorContenedor("grupoComida");
        const misPreferencias = [...gustosFisicos, ...gustosSubjetivos, ...gustosComida];

        // Validaciones obligatorias de las etiquetas seleccionadas
        if (comoSoy.length === 0) {
            alert("Por favor, selecciona al menos una característica en la sección '¿Qué soy?'");
            boton.disabled = false;
            boton.innerHTML = textoOriginal;
            return;
        }

        if (misPreferencias.length === 0) {
            alert("Selecciona algunas opciones en tus secciones de gustos y preferencias.");
            boton.disabled = false;
            boton.innerHTML = textoOriginal;
            return;
        }

        // Armamos el objeto con los nombres exactos de las columnas en tu base de datos
        const nuevoUsuario = {
            nombre: document.getElementById("nombre").value.trim(),
            edad: Number(document.getElementById("edad").value),
            genero: document.getElementById("genero").value,
            facultad: document.getElementById("facultad").value.trim(),
            base: document.getElementById("base").value.trim(),
            instagram: document.getElementById("instagram").value.trim(),
            trago: document.getElementById("trago").value,
            rango_edad_busca: document.getElementById("rangoEdad").value,
            soy: comoSoy,            // Usamos la columna exacta 'soy' que agregaste
            gustos: misPreferencias  // Guarda las preferencias del usuario
        };

        console.log("Registrando usuario en la base de datos...", nuevoUsuario);

        // 1. Guardar los datos en Supabase
        const { error: errorInsertar } = await clienteSupabase
            .from("alumnos")
            .insert([nuevoUsuario]);

        if (errorInsertar) {
            console.error("Error insertando en la base de datos:", errorInsertar);
            throw errorInsertar;
        }

        console.log("¡Usuario registrado con éxito!");

        // 2. Traer todos los alumnos de la base de datos para cruzarlos
        const { data: alumnos, error: errorBusqueda } = await clienteSupabase
            .from("alumnos")
            .select("*");

        if (errorBusqueda) {
            throw errorBusqueda;
        }

        // 3. Pasar a la fase de análisis matemático de matches
        const matches = buscarMatches(nuevoUsuario, alumnos);

        // 4. Renderizar los resultados en pantalla
        mostrarResultados(matches);

    } catch (error) {
        console.error("ERROR EN EL PROCESO:", error);
        alert("Ocurrió un error inesperado: " + error.message);
    } finally {
        // Restauramos el botón a su estado original
        boton.disabled = false;
        boton.innerHTML = textoOriginal;
    }
}
// ==========================================
// MATCH UNMSM - SCRIPT CORREGIDO
// PARTE 3/4: ALGORITMO MATEMÁTICO DE MATCH
// ==========================================

// ==========================================
// ==========================================
// CALCULAR COMPATIBILIDAD CRUCIAL (SOLO DATOS DE MATCH)
// ==========================================
function calcularCompatibilidad(usuario, persona) {
    let puntos = 0;
    let total = 0;

    // 1. CRUCE DE EDAD REQUERIDA (Tu propia edad no te da puntos, tu rango buscado sí)
    const miRangoBusca = usuario.rango_edad_busca.split("-").map(Number);
    const suRangoBusca = (persona.rango_edad_busca || "18-25").split("-").map(Number);

    // ¿La otra persona tiene la edad que YO busco?
    total += 2; 
    if (persona.edad >= miRangoBusca[0] && persona.edad <= miRangoBusca[1]) {
        puntos += 2; 
    }

    // ¿Yo tengo la edad que LA OTRA PERSONA busca?
    total += 2;
    if (usuario.edad >= suRangoBusca[0] && usuario.edad <= suRangoBusca[1]) {
        puntos += 2; 
    }

    // 2. CRUCE FÍSICO REAL (Lo que yo soy vs Lo que a la otra persona le gusta)
    const misAtributos = usuario.soy || [];
    const misGustosFisicos = usuario.gustos ? usuario.gustos.filter(g => 
        ["alto", "bajo", "delgado", "flaco", "atletico", "chapado", "agarrado", "gordito", "blanco", "moreno", "trigueno", "lacio", "ruloso", "con-tatuajes", "sin-tatuajes"].includes(g)
    ) : [];

    const susAtributos = persona.soy || [];
    const susGustosFisicos = persona.gustos ? persona.gustos.filter(g => 
        ["alto", "bajo", "delgado", "flaco", "atletico", "chapado", "agarrado", "gordito", "blanco", "moreno", "trigueno", "lacio", "ruloso", "con-tatuajes", "sin-tatuajes"].includes(g)
    ) : [];

    // ¿A la otra persona le gusta lo que YO SOY?
    if (misAtributos.length > 0) {
        misAtributos.forEach(atributo => {
            total += 1.5;
            if (susGustosFisicos.includes(atributo)) {
                puntos += 1.5; 
            }
        });
    }

    // ¿A mí me gusta lo que LA OTRA PERSONA ES?
    if (susAtributos.length > 0) {
        susAtributos.forEach(atributo => {
            total += 1.5;
            if (misGustosFisicos.includes(atributo)) {
                puntos += 1.5; 
            }
        });
    }

    // 3. COINCIDENCIA EN GUSTOS GENERALES (Subjetivos y Comidas)
    const misGustosGenerales = usuario.gustos ? usuario.gustos.filter(g => !misGustosFisicos.includes(g)) : [];
    const susGustosGenerales = persona.gustos ? persona.gustos.filter(g => !susGustosFisicos.includes(g)) : [];

    if (misGustosGenerales.length > 0) {
        misGustosGenerales.forEach(gusto => {
            total += 1;
            if (susGustosGenerales.includes(gusto)) {
                puntos += 1;
            }
        });
    }

    // 4. TRAGO FAVORITO
    if (usuario.trago && persona.trago) {
        total += 2;
        if (usuario.trago === persona.trago) {
            puntos += (usuario.trago !== "No tomo") ? 2 : 1;
        }
    }

    // Calcular porcentaje final (Facultad eliminada con éxito)
    if (total === 0) return 0;
    let porcentaje = Math.round((puntos / total) * 100);
    return Math.min(porcentaje, 100);
}

 

// ==========================================
// BUSCAR MEJORES MATCHES EN LA LISTA
// ==========================================
function buscarMatches(usuario, alumnos) {
    let resultados = [];

    alumnos.forEach(persona => {
        // 1. No compararse consigo mismo (por instagram)
        if (persona.instagram.toLowerCase() === usuario.instagram.toLowerCase()) {
            return;
        }

        // 2. Filtro estricto de Género (Orientación Heterosexual clásica por defecto)
        if (usuario.genero === "Hombre" && persona.genero !== "Mujer") return;
        if (usuario.genero === "Mujer" && persona.genero !== "Hombre") return;

        // Calcular porcentaje cruzado
        let porcentaje = calcularCompatibilidad(usuario, persona);

        resultados.push({
            ...persona,
            porcentaje: porcentaje
        });
    });

    // Ordenar de mayor a menor compatibilidad
    resultados.sort((a, b) => b.porcentaje - a.porcentaje);

    // Filtrar matches con compatibilidad real superior o igual al 60% y tomar los 2 mejores
    return resultados
        .filter(persona => persona.porcentaje >= 60)
        .slice(0, 2);
}
// ==========================================
// MATCH UNMSM - SCRIPT CORREGIDO
// PARTE 4/4: MOSTRAR RESULTADOS EN PANTALLA
// ==========================================

// ==========================================
// MOSTRAR RESULTADOS
// ==========================================
function mostrarResultados(matches) {
    const seccion = document.getElementById("resultadoSection");
    const contenedor = document.getElementById("contenedorMatches");

    // Limpiamos resultados anteriores
    contenedor.innerHTML = "";

    // Caso de error/vacío: no se encontraron matches con compatibilidad >= 60%
    if (matches.length === 0) {
        seccion.classList.remove("hidden");
        contenedor.innerHTML = `
            <div class="bg-slate-950 rounded-xl p-5 text-center border border-slate-800">
                <h3 class="text-xl font-bold text-slate-300">
                    😢 Aún no hay Match ideal
                </h3>
                <p class="text-sm text-slate-400 mt-3">
                    No encontramos a nadie que cumpla tus filtros y expectativas físicas mutuas (mínimo 60% de compatibilidad). ¡No te preocupes! En cuanto alguien compatible se registre, aparecerá aquí.
                </p>
            </div>
        `;
        
        seccion.scrollIntoView({
            behavior: "smooth"
        });
        return;
    }

    // Recorremos los mejores matches encontrados (máximo 2 por el .slice(0,2) de la parte anterior)
    matches.forEach((persona, index) => {
        let puesto = index === 0 ? "🥇 Mejor Match" : "🥈 Segundo Match";

        contenedor.innerHTML += `
            <div class="bg-slate-950 border border-pink-500/30 rounded-2xl p-5 hover:border-pink-500/60 transition duration-300">
                <h3 class="text-xl font-black text-pink-400">
                    ${puesto}
                </h3>

                <div class="mt-4">
                    <p class="text-lg font-bold text-white">
                        ${persona.nombre}
                    </p>
                    <p class="text-sm text-slate-400 mt-1">
                        🏛️ ${persona.facultad}
                    </p>
                    <p class="text-sm text-slate-400">
                        🎓 Base: ${persona.base} | Edad: ${persona.edad} años
                    </p>
                </div>

                <div class="mt-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-3 shadow-md">
                    <p class="text-white font-bold text-center">
                        🔥 Compatibilidad: ${persona.porcentaje}%
                    </p>
                </div>

                <div class="mt-4 pt-3 border-t border-slate-900">
                    <p class="text-xs text-slate-500">
                        Instagram:
                    </p>
                    <a
                        href="https://instagram.com/${persona.instagram.replace("@", "").trim()}"
                        target="_blank"
                        class="text-pink-400 font-bold hover:underline inline-flex items-center gap-1 mt-1 text-sm"
                    >
                        📸 ${persona.instagram.startsWith("@") ? persona.instagram : "@" + persona.instagram}
                    </a>
                </div>
            </div>
        `;
    });

    // Revelar la sección de resultados en la página
    seccion.classList.remove("hidden");

    // Desplazamiento automático y suave hacia los matches
    seccion.scrollIntoView({
        behavior: "smooth"
    });
}