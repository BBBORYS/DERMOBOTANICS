// ========================================
// CONFIGURACIÓN SUPABASE
// ========================================
const SUPABASE_URL = 'https://llrirxgdeofkedwwvwzz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxscmlyeGdkZW9ma2Vkd3d2d3p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMzA5NTQsImV4cCI6MjA3ODkwNjk1NH0.D4POM0yrlN7UgAQkrOhON8USHcjOKpKh9euHmQwAG5E';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========================================
// CONFIGURACIÓN
// ========================================
const CLAVE_CORRECTA = "admin124";

// ========================================
// ELEMENTOS DEL DOM
// ========================================
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('errorMsg');
const hamburgerIcon = document.getElementById('hamburgerIcon');
const menuNav = document.getElementById('menuNav');
const btnIniciar = document.getElementById('btnIniciar');
const btnCerrar = document.getElementById('btnCerrar');
const btnVolver = document.getElementById('btnVolverCategorias');
const btnAgregarFlotante = document.getElementById('btnAgregarFlotante');
const btnAgregarCategoria = document.getElementById('btnAgregarCategoria');
const btnAgregarItem = document.getElementById('btnAgregarItem');
const buscadorInput = document.getElementById('buscadorInput');
const btnBuscar = document.getElementById('btnBuscar');
const tituloDinamico = document.getElementById('tituloDinamico');
const headerTitle = document.querySelector('header h1');

// Modales
const modalMarca = document.getElementById('modalMarca');
const formMarca = document.getElementById('formMarca');
const modalCategoria = document.getElementById('modalCategoria');
const formCategoria = document.getElementById('formCategoria');
const modalItem = document.getElementById('modalItem');
const formItem = document.getElementById('formItem');

// Previews de imágenes
const imagePreviewMarca = document.getElementById('imagePreviewMarca');
const previewImageMarca = document.getElementById('previewImageMarca');
const fileInputLabelMarca = document.getElementById('fileInputLabelMarca');
const imagePreviewCategoria = document.getElementById('imagePreviewCategoria');
const previewImageCategoria = document.getElementById('previewImageCategoria');
const fileInputLabelCategoria = document.getElementById('fileInputLabelCategoria');
const imagePreviewItem = document.getElementById('imagePreviewItem');
const previewImageItem = document.getElementById('previewImageItem');
const fileInputLabelItem = document.getElementById('fileInputLabelItem');

// Elementos de precio y descuento
const itemPrecioNormal = document.getElementById('itemPrecioNormal');
const itemPrecioDescuento = document.getElementById('itemPrecioDescuento');
const descuentoInfo = document.getElementById('descuentoInfo');
const porcentajeDescuento = document.getElementById('porcentajeDescuento');
const ahorroTexto = document.getElementById('ahorroTexto');

// ========================================
// ESTADO DE LA APLICACIÓN
// ========================================
let sesionActiva = false;
let imagenActualMarca = null;
let imagenActualCategoria = null;
let imagenActualItem = null;
let nivelActual = 'marcas'; // 'marcas', 'categorias', 'productos'
let marcaActual = null;
let categoriaActual = null;
let resultadosBusqueda = null;
let historialNavegacion = [];

// ========================================
// INICIALIZACIÓN
// ========================================
window.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 Inicializando aplicación...');
    
    const sesion = sessionStorage.getItem('sesionActiva');
    
    if (sesion === 'true') {
        sesionActiva = true;
        console.log('✅ Sesión activa encontrada');
    }
    
    actualizarMenu();
    loginModal.classList.add('hidden');
    modalMarca.classList.add('hidden');
    modalCategoria.classList.add('hidden');
    modalItem.classList.add('hidden');
    
    cargarMarcas();
    
    // Event listeners para preview de imágenes
    document.getElementById('marcaImagen').addEventListener('change', function(e) {
        mostrarPreviewImagen(e.target.files[0], 'marca');
    });
    
    document.getElementById('categoriaImagen').addEventListener('change', function(e) {
        mostrarPreviewImagen(e.target.files[0], 'categoria');
    });
    
    document.getElementById('itemImagen').addEventListener('change', function(e) {
        mostrarPreviewImagen(e.target.files[0], 'item');
    });

    // Event listeners para precios y descuentos
    itemPrecioNormal.addEventListener('input', calcularDescuento);
    itemPrecioDescuento.addEventListener('input', calcularDescuento);

    // Event listeners para botones
    btnAgregarCategoria.addEventListener('click', abrirModalAgregarCategoria);
    btnAgregarItem.addEventListener('click', abrirModalAgregarItem);
    btnBuscar.addEventListener('click', buscarProductos);
    buscadorInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            buscarProductos();
        }
    });

    // Configurar botón volver
    btnVolver.addEventListener('click', volverAtras);

    // Configurar clic en el título del header para ir al inicio
    if (headerTitle) {
        headerTitle.style.cursor = 'pointer';
        headerTitle.addEventListener('click', irAlInicio);
    }

    console.log('🚀 Aplicación inicializada correctamente');
    debugEstado();

    btnAgregarFlotante.addEventListener('click', abrirModalAgregar);
});

// ========================================
// FUNCIONES DE IMÁGENES
// ========================================
function mostrarPreviewImagen(file, tipo) {
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (tipo === 'marca') {
                previewImageMarca.src = e.target.result;
                imagePreviewMarca.style.display = 'block';
                fileInputLabelMarca.classList.add('has-image');
                imagenActualMarca = file;
            } else if (tipo === 'categoria') {
                previewImageCategoria.src = e.target.result;
                imagePreviewCategoria.style.display = 'block';
                fileInputLabelCategoria.classList.add('has-image');
                imagenActualCategoria = file;
            } else {
                previewImageItem.src = e.target.result;
                imagePreviewItem.style.display = 'block';
                fileInputLabelItem.classList.add('has-image');
                imagenActualItem = file;
            }
        }
        reader.readAsDataURL(file);
    }
}

async function subirImagen(file, carpeta = 'productos') {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${carpeta}/${fileName}`;

        const { data, error } = await supabase.storage
            .from('productos')
            .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('productos')
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Error subiendo imagen:', error);
        throw error;
    }
}

async function eliminarImagen(url) {
    try {
        const pathSegments = url.split('/');
        const internalPath = pathSegments.slice(pathSegments.indexOf('productos') + 1).join('/');
        
        const { error } = await supabase.storage
            .from('productos')
            .remove([internalPath]);

        if (error) throw error;
    } catch (error) {
        console.error('Error eliminando imagen:', error);
    }
}

// ========================================
// FUNCIONES SUPABASE - MARCAS
// ==============================================
async function cargarMarcas() {
    try {
        console.log('📦 Cargando marcas...');
        const { data: marcas, error } = await supabase
            .from('marcas')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        nivelActual = 'marcas';
        marcaActual = null;
        categoriaActual = null;
        resultadosBusqueda = null;
        
        actualizarTitulo('Tu Bienestar, aquí');
        renderizarMarcas(marcas || []);
        actualizarBotonVolver();
        actualizarBotonesFlotantes();
        actualizarVisibilidadHero();
        
        console.log(`✅ ${marcas?.length || 0} marcas cargadas`);
        
    } catch (error) {
        console.error('❌ Error cargando marcas:', error);
        alert('Error al cargar las marcas');
    }
}

async function agregarMarca(marca) {
    try {
        const { data, error } = await supabase
            .from('marcas')
            .insert([marca])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error agregando marca:', error);
        throw error;
    }
}

async function actualizarMarca(id, datos) {
    try {
        const { data, error } = await supabase
            .from('marcas')
            .update(datos)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error actualizando marca:', error);
        throw error;
    }
}

async function eliminarMarcaDB(id) {
    try {
        // Eliminar imagen de la marca
        const { data: marca } = await supabase
            .from('marcas')
            .select('imagen_url')
            .eq('id', id)
            .single();

        if (marca && marca.imagen_url) {
            await eliminarImagen(marca.imagen_url);
        }

        // Eliminar categorías relacionadas y sus productos
        const { data: categorias } = await supabase
            .from('categorias')
            .select('id, imagen_url')
            .eq('marca_id', id);

        if (categorias && categorias.length > 0) {
            for (const categoria of categorias) {
                await eliminarCategoriaDB(categoria.id);
            }
        }

        // Eliminar marca
        const { error } = await supabase
            .from('marcas')
            .delete()
            .eq('id', id);

        if (error) throw error;
    } catch (error) {
        console.error('Error eliminando marca:', error);
        throw error;
    }
}

// ========================================
// FUNCIONES SUPABASE - CATEGORÍAS
// ========================================
async function cargarCategorias(marcaId) {
    try {
        console.log(`📦 Cargando categorías para marca ${marcaId}...`);
        const { data: categorias, error } = await supabase
            .from('categorias')
            .select('*')
            .eq('marca_id', marcaId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        nivelActual = 'categorias';
        marcaActual = marcaId;
        categoriaActual = null;
        resultadosBusqueda = null;
        
        // Obtener nombre de la marca para el título
        const { data: marca } = await supabase
            .from('marcas')
            .select('nombre')
            .eq('id', marcaId)
            .single();
            
        actualizarTitulo(marca ? `Categorías - ${marca.nombre}` : 'Categorías');
        renderizarCategorias(categorias || []);
        actualizarBotonVolver();
        actualizarBotonesFlotantes();
        actualizarVisibilidadHero();
        
        console.log(`✅ ${categorias?.length || 0} categorías cargadas`);
        
    } catch (error) {
        console.error('❌ Error cargando categorías:', error);
        alert('Error al cargar las categorías');
    }
}

async function agregarCategoria(categoria) {
    try {
        const { data, error } = await supabase
            .from('categorias')
            .insert([categoria])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error agregando categoría:', error);
        throw error;
    }
}

async function actualizarCategoria(id, datos) {
    try {
        const { data, error } = await supabase
            .from('categorias')
            .update(datos)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error actualizando categoría:', error);
        throw error;
    }
}

async function eliminarCategoriaDB(id) {
    try {
        // Eliminar imagen de la categoría
        const { data: categoria } = await supabase
            .from('categorias')
            .select('imagen_url')
            .eq('id', id)
            .single();

        if (categoria && categoria.imagen_url) {
            await eliminarImagen(categoria.imagen_url);
        }

        // Eliminar items relacionados
        const { data: items } = await supabase
            .from('items')
            .select('imagen_url')
            .eq('categoria_id', id);

        if (items && items.length > 0) {
            for (const item of items) {
                if (item.imagen_url) {
                    await eliminarImagen(item.imagen_url);
                }
            }
        }

        await supabase.from('items').delete().eq('categoria_id', id);

        // Eliminar categoría
        const { error } = await supabase
            .from('categorias')
            .delete()
            .eq('id', id);

        if (error) throw error;
    } catch (error) {
        console.error('Error eliminando categoría:', error);
        throw error;
    }
}

// ========================================
// FUNCIONES SUPABASE - ITEMS
// ========================================
async function cargarItems(categoriaId) {
    try {
        console.log(`📦 Cargando productos para categoría ${categoriaId}...`);
        const { data: items, error } = await supabase
            .from('items')
            .select('*')
            .eq('categoria_id', categoriaId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        nivelActual = 'productos';
        categoriaActual = categoriaId;
        resultadosBusqueda = null;
        
        // Obtener nombre de la categoría y marca para el título
        const { data: categoriaInfo } = await supabase
            .from('categorias')
            .select('nombre, marcas(nombre)')
            .eq('id', categoriaId)
            .single();
            
        const titulo = categoriaInfo ? 
            `Productos - ${categoriaInfo.nombre}` : 
            'Productos';
            
        actualizarTitulo(titulo);
        renderizarItems(items || []);
        actualizarBotonVolver();
        actualizarBotonesFlotantes();
        actualizarVisibilidadHero();
        
        console.log(`✅ ${items?.length || 0} productos cargados`);
        
    } catch (error) {
        console.error('❌ Error cargando items:', error);
        alert('Error al cargar los productos');
    }
}

async function agregarItem(item) {
    try {
        const { data, error } = await supabase
            .from('items')
            .insert([item])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error agregando item:', error);
        throw error;
    }
}

async function actualizarItem(id, datos) {
    try {
        const { data, error } = await supabase
            .from('items')
            .update(datos)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error actualizando item:', error);
        throw error;
    }
}

async function eliminarItemDB(id) {
    try {
        const { data: item } = await supabase
            .from('items')
            .select('imagen_url')
            .eq('id', id)
            .single();

        if (item && item.imagen_url) {
            await eliminarImagen(item.imagen_url);
        }

        const { error } = await supabase
            .from('items')
            .delete()
            .eq('id', id);

        if (error) throw error;
    } catch (error) {
        console.error('Error eliminando item:', error);
        throw error;
    }
}

// ========================================
// BÚSQUEDA MEJORADA - BUSCA EN TODO
// ========================================

async function buscarProductos() {
    const termino = buscadorInput.value.trim();
    
    if (!termino) {
        // Si no hay término, restaurar vista anterior
        if (resultadosBusqueda) {
            restaurarVistaAnterior();
        }
        return;
    }

    try {
        // Ocultar hero section cuando se busca
        document.getElementById('heroSection').classList.remove('mostrar-hero');
        
        // Buscar en MARCAS
        const { data: marcas, error: errorMarcas } = await supabase
            .from('marcas')
            .select('*')
            .or(`nombre.ilike.%${termino}%`)
            .order('created_at', { ascending: false });

        if (errorMarcas) throw errorMarcas;

        // Buscar en CATEGORÍAS
        const { data: categorias, error: errorCategorias } = await supabase
            .from('categorias')
            .select('*')
            .or(`nombre.ilike.%${termino}%`)
            .order('created_at', { ascending: false });

        if (errorCategorias) throw errorCategorias;

        // Buscar en PRODUCTOS
        const { data: productos, error: errorProductos } = await supabase
            .from('items')
            .select('*')
            .or(`nombre.ilike.%${termino}%,descripcion.ilike.%${termino}%`)
            .order('created_at', { ascending: false });

        if (errorProductos) throw errorProductos;

        // Combinar todos los resultados
        const todosResultados = [
            ...(marcas || []).map(item => ({ ...item, tipo: 'marca' })),
            ...(categorias || []).map(item => ({ ...item, tipo: 'categoria' })),
            ...(productos || []).map(item => ({ ...item, tipo: 'producto' }))
        ];

        resultadosBusqueda = todosResultados;
        renderizarResultadosBusqueda(resultadosBusqueda, termino);
        
    } catch (error) {
        console.error('Error buscando productos:', error);
        alert('Error al buscar productos');
    }
}

function renderizarResultadosBusqueda(resultados, termino) {
    const productosContainer = document.getElementById('productosContainer');
    productosContainer.innerHTML = '';
    
    if (resultados.length === 0) {
        productosContainer.innerHTML = `
            <p style="text-align: center; grid-column: 1/-1; color: #000000; font-size: 1.2rem;">
                No se encontraron resultados para "${termino}"
            </p>
        `;
        return;
    }
    
    actualizarTitulo(`Resultados para "${termino}"`);
    btnVolver.classList.add('visible');
    btnVolver.textContent = '← Volver';
    
    // Ocultar botones flotantes durante la búsqueda
    actualizarBotonesFlotantes();
    
    resultados.forEach(item => {
        const div = crearElementoBusqueda(item);
        productosContainer.appendChild(div);
    });
}

function crearElementoBusqueda(item) {
    const div = document.createElement('div');
    div.className = 'producto';
    div.setAttribute('data-id', item.id);
    
    const accionesClass = sesionActiva ? 'producto-actions visible' : 'producto-actions';
    
    let contenidoHTML = '';
    let tipoTexto = '';
    
    switch (item.tipo) {
        case 'marca':
            tipoTexto = 'Marca';
            contenidoHTML = `
                <div class="producto-img" onclick="verCategorias(${item.id})">
                    <img src="${item.imagen_url}" alt="${item.nombre}" 
                        onerror="this.src='https://via.placeholder.com/300x200?text=Imagen+No+Disponible'">
                </div>
                <div class="producto-nombre">
                    <h3>${item.nombre}</h3>
                </div>
                <div class="producto-tipo-busqueda" style="padding: 8px; background: #D4AF37; color: white; text-align: center; font-size: 0.8rem; font-weight: bold;">
                    ${tipoTexto}
                </div>
                <div class="${accionesClass}">
                    <button class="btn-editar" onclick="event.stopPropagation(); editarMarca(${item.id})">✏️ Editar</button>
                    <button class="btn-eliminar" onclick="event.stopPropagation(); eliminarMarca(${item.id})">🗑️ Eliminar</button>
                </div>
            `;
            break;
            
        case 'categoria':
            tipoTexto = 'Categoría';
            contenidoHTML = `
                <div class="producto-img" onclick="verProductos(${item.id})">
                    <img src="${item.imagen_url}" alt="${item.nombre}" 
                        onerror="this.src='https://via.placeholder.com/300x200?text=Imagen+No+Disponible'">
                </div>
                <div class="producto-nombre">
                    <h3>${item.nombre}</h3>
                </div>
                <div class="producto-tipo-busqueda" style="padding: 8px; background: #9b59b6; color: white; text-align: center; font-size: 0.8rem; font-weight: bold;">
                    ${tipoTexto}
                </div>
                <div class="${accionesClass}">
                    <button class="btn-editar" onclick="event.stopPropagation(); editarCategoria(${item.id})">✏️ Editar</button>
                    <button class="btn-eliminar" onclick="event.stopPropagation(); eliminarCategoria(${item.id})">🗑️ Eliminar</button>
                </div>
            `;
            break;
            
        case 'producto':
            tipoTexto = 'Producto';
            // Preparar precios
            const precioNormal = item.precio_normal || 0;
            const precioDescuento = item.precio_descuento || 0;
            let preciosHTML = '';
            
            if (precioDescuento > 0 && precioDescuento < precioNormal) {
                const porcentaje = Math.round(((precioNormal - precioDescuento) / precioNormal) * 100);
                preciosHTML = `
                    <div class="producto-precios">
                        <span class="precio-normal">$${precioNormal.toFixed(2)}</span>
                        <span class="precio-descuento">$${precioDescuento.toFixed(2)}</span>
                        <span class="badge-descuento">-${porcentaje}%</span>
                    </div>
                `;
            } else if (precioNormal > 0) {
                preciosHTML = `
                    <div class="producto-precios">
                        <span class="solo-precio">$${precioNormal.toFixed(2)}</span>
                    </div>
                `;
            }
            
            // Preparar descripción
            let descripcionTexto = item.descripcion && item.descripcion.trim() !== '' ? 
                item.descripcion.trim() : 'Sin descripción';
            let descripcionClass = item.descripcion && item.descripcion.trim() !== '' ? '' : ' class="sin-descripcion"';
            
            contenidoHTML = `
                <div class="producto-img">
                    <img src="${item.imagen_url}" alt="${item.nombre}" 
                        onerror="this.src='https://via.placeholder.com/300x200?text=Imagen+No+Disponible'">
                </div>
                <div class="producto-nombre">
                    <h3>${item.nombre}</h3>
                </div>
                <div class="producto-tipo-busqueda" style="padding: 8px; background: #3498db; color: white; text-align: center; font-size: 0.8rem; font-weight: bold;">
                    ${tipoTexto}
                </div>
                ${preciosHTML}
                <div class="producto-descripcion">
                    <p${descripcionClass}>${descripcionTexto}</p>
                </div>
                <div class="${accionesClass}">
                    <button class="btn-editar" onclick="editarItem(${item.id})">✏️ Editar</button>
                    <button class="btn-eliminar" onclick="eliminarItem(${item.id})">🗑️ Eliminar</button>
                </div>
            `;
            break;
    }
    
    div.innerHTML = contenidoHTML;
    return div;
}

function restaurarVistaAnterior() {
    resultadosBusqueda = null;
    buscadorInput.value = '';
    
    switch (nivelActual) {
        case 'marcas':
            cargarMarcas();
            break;
        case 'categorias':
            cargarCategorias(marcaActual);
            break;
        case 'productos':
            cargarItems(categoriaActual);
            break;
    }
}

// ========================================
// RENDERIZADO
// ========================================
function renderizarMarcas(marcas) {
    const productosContainer = document.getElementById('productosContainer');
    productosContainer.innerHTML = '';
    
    if (marcas.length === 0) {
        productosContainer.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: #000000; font-size: 1.2rem;">No hay marcas disponibles</p>';
        return;
    }
    
    marcas.forEach(marca => {
        const div = crearElementoMarca(marca);
        productosContainer.appendChild(div);
    });
}

function crearElementoMarca(marca) {
    const div = document.createElement('div');
    div.className = 'producto';
    div.setAttribute('data-id', marca.id);
    
    const accionesClass = sesionActiva ? 'producto-actions visible' : 'producto-actions';
    
    div.innerHTML = `
        <div class="producto-img" onclick="verCategorias(${marca.id})">
            <img src="${marca.imagen_url}" alt="${marca.nombre}" 
                onerror="this.src='https://via.placeholder.com/300x200?text=Imagen+No+Disponible'">
        </div>
        <div class="producto-nombre">
            <h3>${marca.nombre}</h3>
        </div>
        <div class="${accionesClass}">
            <button class="btn-editar" onclick="event.stopPropagation(); editarMarca(${marca.id})">✏️ Editar</button>
            <button class="btn-eliminar" onclick="event.stopPropagation(); eliminarMarca(${marca.id})">🗑️ Eliminar</button>
        </div>
    `;
    return div;
}

function renderizarCategorias(categorias) {
    const productosContainer = document.getElementById('productosContainer');
    productosContainer.innerHTML = '';
    
    if (categorias.length === 0) {
        productosContainer.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: #000000; font-size: 1.2rem;">No hay categorías disponibles</p>';
        return;
    }
    
    categorias.forEach(categoria => {
        const div = crearElementoCategoria(categoria);
        productosContainer.appendChild(div);
    });
}

function crearElementoCategoria(categoria) {
    const div = document.createElement('div');
    div.className = 'producto';
    div.setAttribute('data-id', categoria.id);
    
    const accionesClass = sesionActiva ? 'producto-actions visible' : 'producto-actions';
    
    div.innerHTML = `
        <div class="producto-img" onclick="verProductos(${categoria.id})">
            <img src="${categoria.imagen_url}" alt="${categoria.nombre}" 
                onerror="this.src='https://via.placeholder.com/300x200?text=Imagen+No+Disponible'">
        </div>
        <div class="producto-nombre">
            <h3>${categoria.nombre}</h3>
        </div>
        <div class="${accionesClass}">
            <button class="btn-editar" onclick="event.stopPropagation(); editarCategoria(${categoria.id})">✏️ Editar</button>
            <button class="btn-eliminar" onclick="event.stopPropagation(); eliminarCategoria(${categoria.id})">🗑️ Eliminar</button>
        </div>
    `;
    return div;
}

function renderizarItems(items) {
    const productosContainer = document.getElementById('productosContainer');
    productosContainer.innerHTML = '';
    
    if (items.length === 0) {
        productosContainer.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: #000000; font-size: 1.2rem;">No hay productos en esta categoría</p>';
        return;
    }
    
    items.forEach(item => {
        const div = crearElementoItem(item);
        productosContainer.appendChild(div);
    });
}

function crearElementoItem(item) {
    const div = document.createElement('div');
    div.className = 'producto';
    div.setAttribute('data-id', item.id);
    
    const accionesClass = sesionActiva ? 'producto-actions visible' : 'producto-actions';
    
    // Preparar descripción
    let descripcionTexto = '';
    let descripcionClass = '';
    
    if (item.descripcion && item.descripcion.trim() !== '') {
        descripcionTexto = item.descripcion.trim();
        descripcionClass = '';
    } else {
        descripcionTexto = 'Sin descripción';
        descripcionClass = ' class="sin-descripcion"';
    }
    
    // Preparar precios
    const precioNormal = item.precio_normal || 0;
    const precioDescuento = item.precio_descuento || 0;
    let preciosHTML = '';
    
    if (precioDescuento > 0 && precioDescuento < precioNormal) {
        const porcentaje = Math.round(((precioNormal - precioDescuento) / precioNormal) * 100);
        preciosHTML = `
            <div class="producto-precios">
                <span class="precio-normal">$${precioNormal.toFixed(2)}</span>
                <span class="precio-descuento">$${precioDescuento.toFixed(2)}</span>
                <span class="badge-descuento">-${porcentaje}%</span>
            </div>
        `;
    } else if (precioNormal > 0) {
        preciosHTML = `
            <div class="producto-precios">
                <span class="solo-precio">$${precioNormal.toFixed(2)}</span>
            </div>
        `;
    }
    
    div.innerHTML = `
        <div class="producto-img">
            <img src="${item.imagen_url}" alt="${item.nombre}" 
                onerror="this.src='https://via.placeholder.com/300x200?text=Imagen+No+Disponible'">
        </div>
        <div class="producto-nombre">
            <h3>${item.nombre}</h3>
        </div>
        ${preciosHTML}
        <div class="producto-descripcion">
            <p${descripcionClass}>${descripcionTexto}</p>
        </div>
        <div class="${accionesClass}">
            <button class="btn-editar" onclick="editarItem(${item.id})">✏️ Editar</button>
            <button class="btn-eliminar" onclick="eliminarItem(${item.id})">🗑️ Eliminar</button>
        </div>
    `;
    
    return div;
}

// ========================================
// NAVEGACIÓN MEJORADA
// ========================================
function verCategorias(marcaId) {
    console.log(`🔍 Navegando a categorías de marca ${marcaId}`);
    cargarCategorias(marcaId);
}

function verProductos(categoriaId) {
    console.log(`🔍 Navegando a productos de categoría ${categoriaId}`);
    cargarItems(categoriaId);
}

function volverAtras() {
    console.log('↩️ Volviendo atrás');
    
    if (resultadosBusqueda) {
        // Si estamos en búsqueda, restaurar vista anterior
        restaurarVistaAnterior();
        return;
    }
    
    // Navegación normal entre niveles
    switch (nivelActual) {
        case 'categorias':
            cargarMarcas();
            break;
        case 'productos':
            if (marcaActual) {
                cargarCategorias(marcaActual);
            } else {
                cargarMarcas();
            }
            break;
        default:
            cargarMarcas();
    }
}

function irAlInicio() {
    console.log('🏠 Yendo al inicio');
    cargarMarcas();
}

// ========================================
// MANEJO DE INTERFAZ
// ========================================
function actualizarTitulo(texto) {
    if (tituloDinamico) {
        tituloDinamico.textContent = texto;
    }
}

function actualizarBotonVolver() {
    console.log('🔄 Actualizando botón volver - Nivel:', nivelActual);
    
    // Mostrar botón volver solo si no estamos en el nivel principal de marcas
    if (nivelActual === 'marcas' && !resultadosBusqueda) {
        btnVolver.classList.remove('visible');
    } else {
        btnVolver.classList.add('visible');
        btnVolver.textContent = '← Volver';
    }
}

function actualizarBotonesFlotantes() {
    console.log('🔄 Actualizando botones flotantes - Nivel:', nivelActual, 'Sesión:', sesionActiva);
    
    // Ocultar todos primero
    btnAgregarFlotante.classList.remove('visible');
    btnAgregarCategoria.classList.remove('visible');
    btnAgregarItem.classList.remove('visible');
    
    // Mostrar según nivel y sesión (no mostrar durante búsqueda)
    if (sesionActiva && !resultadosBusqueda) {
        switch (nivelActual) {
            case 'marcas':
                btnAgregarFlotante.classList.add('visible');
                btnAgregarFlotante.textContent = '➕ Agregar Marca';
                break;
            case 'categorias':
                btnAgregarCategoria.classList.add('visible');
                break;
            case 'productos':
                btnAgregarItem.classList.add('visible');
                break;
        }
    }
}

function actualizarVisibilidadHero() {
    const heroSection = document.getElementById('heroSection');
    
    // Mostrar hero solo en el nivel principal de marcas y sin búsqueda activa
    if (nivelActual === 'marcas' && !resultadosBusqueda) {
        heroSection.classList.add('mostrar-hero');
    } else {
        heroSection.classList.remove('mostrar-hero');
    }
}

// ========================================
// MANEJO DE SESIÓN
// ========================================
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const claveIngresada = passwordInput.value.trim();

    if (claveIngresada === CLAVE_CORRECTA) {
        sesionActiva = true;
        sessionStorage.setItem('sesionActiva', 'true');
        cerrarModalLogin();
        actualizarMenu();
        mostrarBotonesEdicion();
        actualizarBotonesFlotantes();
        console.log('🔓 Sesión iniciada correctamente');
    } else {
        errorMsg.textContent = '❌ Clave incorrecta. Intenta de nuevo.';
        passwordInput.value = '';
        passwordInput.focus();
    }
});

function cerrarModalLogin() {
    loginModal.classList.add('hidden');
    errorMsg.textContent = '';
    passwordInput.value = '';
}

btnIniciar.addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.classList.remove('hidden');
    passwordInput.focus();
    cerrarMenuHamburguesa();
});

btnCerrar.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        sesionActiva = false;
        sessionStorage.removeItem('sesionActiva');
        actualizarMenu();
        ocultarBotonesEdicion();
        actualizarBotonesFlotantes();
        cerrarMenuHamburguesa();
        console.log('🔒 Sesión cerrada');
    }
});

// ========================================
// MENÚ HAMBURGUESA
// ========================================
hamburgerIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    hamburgerIcon.classList.toggle('active');
    menuNav.classList.toggle('active');
});

document.addEventListener('click', (e) => {
    if (!hamburgerIcon.contains(e.target) && !menuNav.contains(e.target)) {
        cerrarMenuHamburguesa();
    }
});

function cerrarMenuHamburguesa() {
    hamburgerIcon.classList.remove('active');
    menuNav.classList.remove('active');
}

// ========================================
// GESTIÓN DE INTERFAZ
// ========================================
function actualizarMenu() {
    if (sesionActiva) {
        btnIniciar.classList.add('hidden');
        btnCerrar.classList.remove('hidden');
    } else {
        btnIniciar.classList.remove('hidden');
        btnCerrar.classList.add('hidden');
    }
}

function mostrarBotonesEdicion() {
    const acciones = document.querySelectorAll('.producto-actions');
    acciones.forEach(accion => accion.classList.add('visible'));
    actualizarBotonesFlotantes();
    console.log('👁️ Botones de edición mostrados');
}

function ocultarBotonesEdicion() {
    const acciones = document.querySelectorAll('.producto-actions');
    acciones.forEach(accion => accion.classList.remove('visible'));
    actualizarBotonesFlotantes();
    console.log('👁️ Botones de edición ocultados');
}

// ========================================
// SISTEMA DE PRECIOS Y DESCUENTOS
// ========================================
function calcularDescuento() {
    const precioNormal = parseFloat(itemPrecioNormal.value) || 0;
    const precioDescuento = parseFloat(itemPrecioDescuento.value) || 0;
    
    if (precioDescuento > 0 && precioDescuento < precioNormal) {
        const porcentaje = Math.round(((precioNormal - precioDescuento) / precioNormal) * 100);
        const ahorro = precioNormal - precioDescuento;
        
        porcentajeDescuento.textContent = `-${porcentaje}%`;
        ahorroTexto.textContent = `Ahorras $${ahorro.toFixed(2)}`;
        descuentoInfo.style.display = 'block';
    } else {
        descuentoInfo.style.display = 'none';
    }
}

// ========================================
// GESTIÓN DE MARCAS (CRUD)
// ========================================
function abrirModalAgregar() {
    if (!sesionActiva) {
        alert('Debe iniciar sesión para agregar marcas');
        return;
    }
    
    document.getElementById('tituloModalMarca').textContent = 'Agregar Marca';
    formMarca.reset();
    document.getElementById('marcaId').value = '';
    imagePreviewMarca.style.display = 'none';
    fileInputLabelMarca.classList.remove('has-image');
    imagenActualMarca = null;
    modalMarca.classList.remove('hidden');
}

function cerrarModalMarca() {
    modalMarca.classList.add('hidden');
    formMarca.reset();
    imagePreviewMarca.style.display = 'none';
    fileInputLabelMarca.classList.remove('has-image');
    imagenActualMarca = null;
}

async function editarMarca(id) {
    if (!sesionActiva) {
        alert('Debe iniciar sesión para editar marcas');
        return;
    }

    try {
        const { data: marca, error } = await supabase
            .from('marcas')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        document.getElementById('tituloModalMarca').textContent = 'Editar Marca';
        document.getElementById('marcaId').value = marca.id;
        document.getElementById('marcaNombre').value = marca.nombre;
        
        previewImageMarca.src = marca.imagen_url;
        imagePreviewMarca.style.display = 'block';
        fileInputLabelMarca.classList.add('has-image');
        
        imagenActualMarca = null;
        modalMarca.classList.remove('hidden');
    } catch (error) {
        console.error('Error cargando marca:', error);
        alert('Error al cargar la marca');
    }
}

async function eliminarMarca(id) {
    if (!sesionActiva) {
        alert('Debe iniciar sesión para eliminar marcas');
        return;
    }

    if (confirm('¿Está seguro? Esto eliminará la marca, todas sus categorías y productos.')) {
        try {
            await eliminarMarcaDB(id);
            await cargarMarcas();
        } catch (error) {
            alert('Error al eliminar la marca');
        }
    }
}

formMarca.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('marcaId').value;
    const nombre = document.getElementById('marcaNombre').value.trim();

    if (!id && !imagenActualMarca) {
        alert('Por favor seleccione una imagen para la nueva marca');
        return;
    }

    try {
        let imagen_url = previewImageMarca.src;

        if (imagenActualMarca) {
            if (id) {
                const { data: marcaAnterior } = await supabase
                    .from('marcas')
                    .select('imagen_url')
                    .eq('id', id)
                    .single();
                    
                if (marcaAnterior && marcaAnterior.imagen_url) {
                    eliminarImagen(marcaAnterior.imagen_url);
                }
            }
            imagen_url = await subirImagen(imagenActualMarca, 'marcas');
        }

        const datosMarca = {
            nombre: nombre,
            imagen_url: imagen_url
        };

        if (id) {
            await actualizarMarca(id, datosMarca);
        } else {
            await agregarMarca(datosMarca);
        }

        await cargarMarcas();
        cerrarModalMarca();
    } catch (error) {
        alert('Error al guardar la marca: ' + error.message);
    }
});

// ========================================
// GESTIÓN DE CATEGORÍAS (CRUD)
// ========================================
function abrirModalAgregarCategoria() {
    if (!sesionActiva) {
        alert('Debe iniciar sesión para agregar categorías');
        return;
    }
    
    document.getElementById('tituloModalCategoria').textContent = 'Agregar Categoría';
    formCategoria.reset();
    document.getElementById('categoriaId').value = '';
    document.getElementById('categoriaMarcaId').value = marcaActual;
    imagePreviewCategoria.style.display = 'none';
    fileInputLabelCategoria.classList.remove('has-image');
    imagenActualCategoria = null;
    modalCategoria.classList.remove('hidden');
}

function cerrarModalCategoria() {
    modalCategoria.classList.add('hidden');
    formCategoria.reset();
    imagePreviewCategoria.style.display = 'none';
    fileInputLabelCategoria.classList.remove('has-image');
    imagenActualCategoria = null;
}

async function editarCategoria(id) {
    if (!sesionActiva) {
        alert('Debe iniciar sesión para editar categorías');
        return;
    }

    try {
        const { data: categoria, error } = await supabase
            .from('categorias')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        document.getElementById('tituloModalCategoria').textContent = 'Editar Categoría';
        document.getElementById('categoriaId').value = categoria.id;
        document.getElementById('categoriaMarcaId').value = categoria.marca_id;
        document.getElementById('categoriaNombre').value = categoria.nombre;
        
        previewImageCategoria.src = categoria.imagen_url;
        imagePreviewCategoria.style.display = 'block';
        fileInputLabelCategoria.classList.add('has-image');
        
        imagenActualCategoria = null;
        modalCategoria.classList.remove('hidden');
    } catch (error) {
        console.error('Error cargando categoría:', error);
        alert('Error al cargar la categoría');
    }
}

async function eliminarCategoria(id) {
    if (!sesionActiva) {
        alert('Debe iniciar sesión para eliminar categorías');
        return;
    }

    if (confirm('¿Está seguro? Esto eliminará la categoría y todos sus productos.')) {
        try {
            await eliminarCategoriaDB(id);
            await cargarCategorias(marcaActual);
        } catch (error) {
            alert('Error al eliminar la categoría');
        }
    }
}

formCategoria.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('categoriaId').value;
    const marcaId = document.getElementById('categoriaMarcaId').value;
    const nombre = document.getElementById('categoriaNombre').value.trim();

    if (!id && !imagenActualCategoria) {
        alert('Por favor seleccione una imagen para la nueva categoría');
        return;
    }

    try {
        let imagen_url = previewImageCategoria.src;

        if (imagenActualCategoria) {
            if (id) {
                const { data: categoriaAnterior } = await supabase
                    .from('categorias')
                    .select('imagen_url')
                    .eq('id', id)
                    .single();
                    
                if (categoriaAnterior && categoriaAnterior.imagen_url) {
                    eliminarImagen(categoriaAnterior.imagen_url);
                }
            }
            imagen_url = await subirImagen(imagenActualCategoria, 'categorias');
        }

        const datosCategoria = {
            marca_id: marcaId,
            nombre: nombre,
            imagen_url: imagen_url
        };

        if (id) {
            await actualizarCategoria(id, datosCategoria);
        } else {
            await agregarCategoria(datosCategoria);
        }

        await cargarCategorias(marcaId);
        cerrarModalCategoria();
    } catch (error) {
        alert('Error al guardar la categoría: ' + error.message);
    }
});

// ========================================
// GESTIÓN DE ITEMS (CRUD)
// ========================================
function abrirModalAgregarItem() {
    if (!sesionActiva) {
        alert('Debe iniciar sesión para agregar productos');
        return;
    }
    
    document.getElementById('tituloModalItem').textContent = 'Agregar Producto';
    formItem.reset();
    document.getElementById('itemId').value = '';
    document.getElementById('itemCategoriaId').value = categoriaActual;
    imagePreviewItem.style.display = 'none';
    fileInputLabelItem.classList.remove('has-image');
    imagenActualItem = null;
    descuentoInfo.style.display = 'none';
    modalItem.classList.remove('hidden');
}

function cerrarModalItem() {
    modalItem.classList.add('hidden');
    formItem.reset();
    imagePreviewItem.style.display = 'none';
    fileInputLabelItem.classList.remove('has-image');
    imagenActualItem = null;
    descuentoInfo.style.display = 'none';
}

async function editarItem(id) {
    if (!sesionActiva) {
        alert('Debe iniciar sesión para editar productos');
        return;
    }

    try {
        const { data: item, error } = await supabase
            .from('items')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        document.getElementById('tituloModalItem').textContent = 'Editar Producto';
        document.getElementById('itemId').value = item.id;
        document.getElementById('itemCategoriaId').value = item.categoria_id;
        document.getElementById('itemNombre').value = item.nombre;
        document.getElementById('itemDescripcion').value = item.descripcion || '';
        document.getElementById('itemPrecioNormal').value = item.precio_normal || '';
        document.getElementById('itemPrecioDescuento').value = item.precio_descuento || '';
        
        previewImageItem.src = item.imagen_url;
        imagePreviewItem.style.display = 'block';
        fileInputLabelItem.classList.add('has-image');
        
        imagenActualItem = null;
        
        // Calcular descuento si hay precios
        calcularDescuento();
        
        modalItem.classList.remove('hidden');
    } catch (error) {
        console.error('Error cargando item:', error);
        alert('Error al cargar el producto');
    }
}

async function eliminarItem(id) {
    if (!sesionActiva) {
        alert('Debe iniciar sesión para eliminar productos');
        return;
    }

    if (confirm('¿Está seguro que desea eliminar este producto?')) {
        try {
            await eliminarItemDB(id);
            await cargarItems(categoriaActual);
        } catch (error) {
            alert('Error al eliminar el producto');
        }
    }
}

formItem.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('itemId').value;
    const categoriaId = document.getElementById('itemCategoriaId').value;
    const nombre = document.getElementById('itemNombre').value.trim();
    const descripcion = document.getElementById('itemDescripcion').value.trim();
    const precioNormal = parseFloat(document.getElementById('itemPrecioNormal').value) || 0;
    const precioDescuento = parseFloat(document.getElementById('itemPrecioDescuento').value) || 0;

    if (!id && !imagenActualItem) {
        alert('Por favor seleccione una imagen para el nuevo producto');
        return;
    }

    try {
        let imagen_url = previewImageItem.src;

        if (imagenActualItem) {
            if (id) {
                const { data: itemAnterior } = await supabase
                    .from('items')
                    .select('imagen_url')
                    .eq('id', id)
                    .single();
                    
                if (itemAnterior && itemAnterior.imagen_url) {
                    eliminarImagen(itemAnterior.imagen_url);
                }
            }
            imagen_url = await subirImagen(imagenActualItem, 'items');
        }

        const datosItem = {
            categoria_id: categoriaId,
            nombre: nombre,
            descripcion: descripcion,
            precio_normal: precioNormal,
            precio_descuento: precioDescuento,
            imagen_url: imagen_url
        };

        if (id) {
            await actualizarItem(id, datosItem);
        } else {
            await agregarItem(datosItem);
        }

        await cargarItems(categoriaId);
        cerrarModalItem();
    } catch (error) {
        alert('Error al guardar el producto: ' + error.message);
    }
});

// ========================================
// FUNCIÓN DE DEPURACIÓN
// ========================================
function debugEstado() {
    console.log('=== 🐛 DEBUG ESTADO ===');
    console.log('Sesión activa:', sesionActiva);
    console.log('Nivel actual:', nivelActual);
    console.log('Marca actual:', marcaActual);
    console.log('Categoría actual:', categoriaActual);
    console.log('Resultados búsqueda:', resultadosBusqueda);
    console.log('Botón volver visible:', document.getElementById('btnVolverCategorias')?.classList.contains('visible'));
    console.log('Botones flotantes:', {
        agregarMarca: document.getElementById('btnAgregarFlotante')?.classList.contains('visible'),
        agregarCategoria: document.getElementById('btnAgregarCategoria')?.classList.contains('visible'),
        agregarProducto: document.getElementById('btnAgregarItem')?.classList.contains('visible')
    });
    console.log('=== FIN DEBUG ===');
}

// ========================================
// CERRAR MODALES CON ESC
// ========================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (!modalMarca.classList.contains('hidden')) {
            cerrarModalMarca();
        }
        if (!modalCategoria.classList.contains('hidden')) {
            cerrarModalCategoria();
        }
        if (!modalItem.classList.contains('hidden')) {
            cerrarModalItem();
        }
        if (!loginModal.classList.contains('hidden')) {
            loginModal.classList.add('hidden');
            passwordInput.value = '';
            errorMsg.textContent = '';
        }
    }
});

// Hacer la función debugEstado disponible globalmente
window.debugEstado = debugEstado;