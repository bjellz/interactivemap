// Global variabler (nå deklarert globalt ELLER som parametere for initializeMapAndData)
let map;
let drawnItems;
let drawControl; // For å kunne fjerne/legge til drawControl

// Denne funksjonen vil nå initialisere kartet og all kart-relatert logikk
// 'isAdminView' (boolean) kontrollerer om redigeringsfunksjonalitet er aktiv
function initializeMapAndData(isAdminView) {
    const colorOptions = {
        'Basketpool': { color: '#4CAF50', fillColor: '#A5D6A7', fillOpacity: 0.6 },
        'Redzone': { color: '#E53935', fillColor: '#EF9A9A', fillOpacity: 0.6 },
        'Wireline lagring': { color: '#1E88E5', fillColor: '#90CAF9', fillOpacity: 0.6 },
        'Coring lagring': { color: '#FB8C00', fillColor: '#FFCC80', fillOpacity: 0.6 },
        'CWI Retur': { color: '#8E24AA', fillColor: '#CE93D8', fillOpacity: 0.6 },
        'FES lagring': { color: '#00897B', fillColor: '#80CBC4', fillOpacity: 0.6 },
        'DS Retur': { color: '#E10087B', fillColor: '#FFCC80', fillOpacity: 0.6 }
    };

    const markerIcons = {
        'default_marker': L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        }),
        'Fyllestasjon': L.icon({
            iconUrl: 'https://cdn4.iconfinder.com/data/icons/unigrid-flat-buildings/90/008_084_gas_fuel_gasoline_diesel_petroleum_station-64.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        }),
        'Miljøstasjon': L.icon({
            iconUrl: 'https://cdn1.iconfinder.com/data/icons/bokbokstars-121-classic-stock-icons-1/512/Recover-arrow.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        }),
        'Truckpark': L.icon({
            iconUrl: 'https://cdn4.iconfinder.com/data/icons/global-logistics-2/512/53-64.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        }),
        'Industrivern': L.icon({
            iconUrl: 'https://cdn0.iconfinder.com/data/icons/expenses-vs-income/30/__healthcare_medicine_expense_ambulance-64.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        }),
        'Racks': L.icon({
            iconUrl: 'https://cdn4.iconfinder.com/data/icons/technology-devices-1/500/hard-disk-hdd-64.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        }),
        'Palleområde': L.icon({
            iconUrl: 'https://cdn1.iconfinder.com/data/icons/warehouse-icon-set-1/512/Euro-pallet-flat-group-02-64.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        })
    };

    function getMarkerIcon(name) {
        return markerIcons[name] || markerIcons['default_marker'];
    }

    let shapeIdCounter = 0;

    // Initialiser kartet
    map = L.map('map').setView([58.9150, 5.6003], 17.5);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri',
        maxZoom: 19,
    }).addTo(map);

    drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    // Initialiser drawControl KUN hvis det er admin-visning
    if (isAdminView) {
        drawControl = new L.Control.Draw({
            edit: { featureGroup: drawnItems, edit: true, remove: true },
            draw: {
                polygon: true,
                rectangle: true,
                marker: true,
                polyline: false,
                circle: false,
                circlemarker: false
            }
        });
        map.addControl(drawControl);
    }


    // Hent elementer for modalen KUN hvis de eksisterer (dvs. i admin.html)
    const editModal = document.getElementById('editModal');
    const modalTitle = document.getElementById('modalTitle');
    const editNameInput = document.getElementById('editName');
    const editTagsInput = document.getElementById('editTags');
    const markerOptionsDiv = document.getElementById('markerOptions');
    const editIconSelect = document.getElementById('editIcon');
    const areaOptionsDiv = document.getElementById('areaOptions');
    const editAreaTypeSelect = document.getElementById('editAreaType');
    const saveEditBtn = document.getElementById('saveEdit');
    const cancelEditBtn = document.getElementById('cancelEdit');
    const clearDataBtn = document.getElementById('clearDataBtn');

    const markerImageUpload = document.getElementById('markerImageUpload');
    const currentMarkerImagePreviewDiv = document.getElementById('currentMarkerImagePreview');
    const markerImagePreview = document.getElementById('markerImagePreview');
    const removeMarkerImageBtn = document.getElementById('removeMarkerImage');

    const isUnderMaintenanceCheckbox = document.getElementById('isUnderMaintenanceCheckbox');

    let currentEditingLayer = null;

    const areaList = document.getElementById('areaList');
    const markerList = document.getElementById('markerList');
    const areaFilterButtonsDiv = document.getElementById('areaFilterButtons');
    const markerFilterButtonsDiv = document.getElementById('markerFilterButtons');

    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    let currentSearchTerm = '';

    let showAreas = true;
    let showMarkers = true;

    const toggleAreasBtn = document.getElementById('toggleAreasBtn');
    const toggleMarkersBtn = document.getElementById('toggleMarkersBtn');

    // Kun aktiver disse lytterne hvis elementene finnes (dvs. i admin.html)
    if (toggleAreasBtn) {
        toggleAreasBtn.onclick = () => {
            showAreas = !showAreas;
            toggleAreasBtn.classList.toggle('active', showAreas);
            filterMapLayers();
            updateSidebar();
        };
    }

    if (toggleMarkersBtn) {
        toggleMarkersBtn.onclick = () => {
            showMarkers = !showMarkers;
            toggleMarkersBtn.classList.toggle('active', showMarkers);
            filterMapLayers();
            updateSidebar();
        };
    }

    let currentAreaFilter = 'Alle';
    let currentMarkerFilter = 'Alle';

    function populateModalOptions() {
        if (!editIconSelect) return; // Ikke prøv å fylle hvis elementet ikke finnes
        editIconSelect.innerHTML = '';
        for (const key in markerIcons) {
            if (key === 'default_marker') continue;
            const option = document.createElement('option');
            option.value = key;
            option.textContent = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
            editIconSelect.appendChild(option);
        }

        if (!editAreaTypeSelect) return; // Ikke prøv å fylle hvis elementet ikke finnes
        editAreaTypeSelect.innerHTML = '';
        for (const key in colorOptions) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = key;
            editAreaTypeSelect.appendChild(option);
        }
    }

    function setupFilterButtons() {
        if (!areaFilterButtonsDiv) return;
        areaFilterButtonsDiv.innerHTML = '';
        let allAreasBtn = document.createElement('button');
        allAreasBtn.textContent = 'Alle';
        allAreasBtn.classList.add('active');
        allAreasBtn.onclick = () => setAreaFilter('Alle');
        areaFilterButtonsDiv.appendChild(allAreasBtn);

        for (const type in colorOptions) {
            let btn = document.createElement('button');
            btn.textContent = type;
            btn.onclick = () => setAreaFilter(type);
            areaFilterButtonsDiv.appendChild(btn);
        }

        if (!markerFilterButtonsDiv) return;
        markerFilterButtonsDiv.innerHTML = '';
        let allMarkersBtn = document.createElement('button');
        allMarkersBtn.textContent = 'Alle';
        allMarkersBtn.classList.add('active');
        allMarkersBtn.onclick = () => setMarkerFilter('Alle');
        markerFilterButtonsDiv.appendChild(allMarkersBtn);

        for (const type in markerIcons) {
            if (type === 'default_marker') continue;
            let btn = document.createElement('button');
            btn.textContent = type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
            btn.onclick = () => setMarkerFilter(type);
            markerFilterButtonsDiv.appendChild(btn);
        }
    }

    function setAreaFilter(filter) {
        currentAreaFilter = filter;
        updateSidebar();
        updateFilterButtonActiveState(areaFilterButtonsDiv, filter);
        filterMapLayers();
    }

    function setMarkerFilter(filter) {
        currentMarkerFilter = filter;
        updateSidebar();
        updateFilterButtonActiveState(markerFilterButtonsDiv, filter);
        filterMapLayers();
    }

    function updateFilterButtonActiveState(container, activeFilter) {
        if (!container) return; // Sørg for at containeren finnes
        Array.from(container.children).forEach(button => {
            const buttonValue = button.textContent.toLowerCase().replace(/ /g, '_');
            if (button.textContent === activeFilter || buttonValue === activeFilter.toLowerCase().replace(/ /g, '_')) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    function shouldLayerBeVisible(layer, searchTermLower) {
        const name = layer.feature?.properties?.name || '';
        const tags = layer.feature?.properties?.tags || [];
        const tagsString = tags.join(' ').toLowerCase();

        const nameMatchesSearch = searchTermLower === '' || name.toLowerCase().includes(searchTermLower);
        const tagsMatchSearch = searchTermLower === '' || tagsString.includes(searchTermLower);
        const searchMatches = nameMatchesSearch || tagsMatchSearch;

        if (layer instanceof L.Marker) {
            if (!showMarkers && searchTermLower === '') {
                return false;
            }
            const iconType = layer.feature?.properties?.icon || 'default_marker';
            return (currentMarkerFilter === 'Alle' || iconType === currentMarkerFilter) && searchMatches;
        } else {
            if (!showAreas && searchTermLower === '') {
                return false;
            }
            const areaType = layer.feature?.properties?.area || 'Basketpool';
            return (currentAreaFilter === 'Alle' || areaType === currentAreaFilter) && searchMatches;
        }
    }

    function filterMapLayers() {
        const searchTermLower = currentSearchTerm.toLowerCase();

        drawnItems.eachLayer(layer => {
            if (shouldLayerBeVisible(layer, searchTermLower)) {
                if (!map.hasLayer(layer)) {
                    layer.addTo(map);
                }
                if (layer instanceof L.Marker) {
                    updateMaintenanceCircle(layer);
                }
            } else {
                if (map.hasLayer(layer)) {
                    map.removeLayer(layer);
                }
                if (layer instanceof L.Marker && layer._maintenanceCircle) {
                    layer._maintenanceCircle.remove();
                    delete layer._maintenanceCircle;
                }
            }
        });
    }

    function updateMaintenanceCircle(marker) {
        if (marker.feature?.properties?.isUnderMaintenance) {
            if (!marker._maintenanceCircle) {
                marker._maintenanceCircle = L.circle(marker.getLatLng(), {
                    radius: 15,
                    color: '#E53935',
                    fillColor: '#E53935',
                    fillOpacity: 0.2,
                    weight: 2,
                    dashArray: '5, 5',
                    interactive: false
                }).addTo(map);
                marker.on('drag', function() {
                    marker._maintenanceCircle.setLatLng(marker.getLatLng());
                });
            } else {
                marker._maintenanceCircle.setLatLng(marker.getLatLng());
                if (!map.hasLayer(marker._maintenanceCircle)) {
                    marker._maintenanceCircle.addTo(map);
                }
            }
        } else {
            if (marker._maintenanceCircle) {
                marker._maintenanceCircle.remove();
                delete marker._maintenanceCircle;
            }
        }
    }

    // openEditModal og closeEditModal kalles kun i admin-visning
    function openEditModal(layer) {
        if (!isAdminView) return; // Kun tillatt for admin
        currentEditingLayer = layer;
        const isMarker = layer instanceof L.Marker;

        if (markerImageUpload) markerImageUpload.value = '';
        if (currentMarkerImagePreviewDiv) currentMarkerImagePreviewDiv.style.display = 'none';
        if (markerImagePreview) markerImagePreview.src = '';

        if (editNameInput) editNameInput.value = layer.feature.properties.name || '';
        if (editTagsInput) editTagsInput.value = (layer.feature.properties.tags || []).join(', ');

        if (isMarker) {
            if (modalTitle) modalTitle.textContent = 'Rediger Markør';
            if (markerOptionsDiv) markerOptionsDiv.style.display = 'block';
            if (areaOptionsDiv) areaOptionsDiv.style.display = 'none';

            if (editIconSelect) editIconSelect.value = layer.feature.properties.icon || 'default_marker';
            if (isUnderMaintenanceCheckbox) isUnderMaintenanceCheckbox.checked = !!layer.feature.properties.isUnderMaintenance;

            if (layer.feature.properties.imageData && markerImagePreview && currentMarkerImagePreviewDiv) {
                markerImagePreview.src = layer.feature.properties.imageData;
                currentMarkerImagePreviewDiv.style.display = 'block';
            }
        } else {
            if (modalTitle) modalTitle.textContent = 'Rediger Område';
            if (markerOptionsDiv) markerOptionsDiv.style.display = 'none';
            if (areaOptionsDiv) areaOptionsDiv.style.display = 'block';

            if (editAreaTypeSelect) editAreaTypeSelect.value = layer.feature.properties.area || 'Basketpool';
        }
        if (editModal) editModal.style.display = 'flex';
    }

    function closeEditModal() {
        if (!isAdminView) return; // Kun tillatt for admin
        if (editModal) editModal.style.display = 'none';
        currentEditingLayer = null;
        if (markerImageUpload) markerImageUpload.value = '';
        if (currentMarkerImagePreviewDiv) currentMarkerImagePreviewDiv.style.display = 'none';
        if (markerImagePreview) markerImagePreview.src = '';
        if (isUnderMaintenanceCheckbox) isUnderMaintenanceCheckbox.checked = false;
    }

    // Hendelseslyttere for modal-elementer (kun i admin-visning)
    if (isAdminView) {
        if (markerImageUpload) markerImageUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(readerEvent) {
                    if (markerImagePreview) markerImagePreview.src = readerEvent.target.result;
                    if (currentMarkerImagePreviewDiv) currentMarkerImagePreviewDiv.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });

        if (removeMarkerImageBtn) removeMarkerImageBtn.onclick = () => {
            if (markerImageUpload) markerImageUpload.value = '';
            if (markerImagePreview) markerImagePreview.src = '';
            if (currentMarkerImagePreviewDiv) currentMarkerImagePreviewDiv.style.display = 'none';
            if (currentEditingLayer && currentEditingLayer.feature && currentEditingLayer.feature.properties) {
                delete currentEditingLayer.feature.properties.imageData;
            }
        };

        if (saveEditBtn) saveEditBtn.onclick = () => {
            if (!currentEditingLayer) return;

            const newName = editNameInput.value.trim();
            if (!newName) {
                alert('Navn kan ikke være tomt.');
                return;
            }

            const newTagsString = editTagsInput.value.trim();
            const newTags = newTagsString === '' ? [] : newTagsString.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
            currentEditingLayer.feature.properties.tags = newTags;

            const isMarker = currentEditingLayer instanceof L.Marker;

            if (isMarker) {
                const newIcon = editIconSelect.value;
                currentEditingLayer.feature.properties.name = newName;
                currentEditingLayer.feature.properties.icon = newIcon;
                currentEditingLayer.setIcon(getMarkerIcon(newIcon));

                currentEditingLayer.feature.properties.isUnderMaintenance = isUnderMaintenanceCheckbox.checked;
                updateMaintenanceCircle(currentEditingLayer);

                if (markerImagePreview.src && markerImagePreview.src.startsWith('data:image/')) {
                    currentEditingLayer.feature.properties.imageData = markerImagePreview.src;
                } else {
                    delete currentEditingLayer.feature.properties.imageData;
                }

                let popupContent = `<b>${newName}</b>`;
                if (newTags.length > 0) {
                    popupContent += `<br>Tags: ${newTags.join(', ')}`;
                }
                if (currentEditingLayer.feature.properties.isUnderMaintenance) {
                    popupContent += `<br><span style="color: red; font-weight: bold;">Vedlikehold pågår</span>`;
                }
                if (currentEditingLayer.feature.properties.imageData) {
                    popupContent += `<br><img src="${currentEditingLayer.feature.properties.imageData}" style="max-width:200px; max-height:150px; margin-top: 10px;">`;
                }
                if (currentEditingLayer._popup) {
                    currentEditingLayer.getPopup().setContent(popupContent);
                } else {
                    currentEditingLayer.bindPopup(popupContent);
                }

                if (currentEditingLayer._tooltip) {
                    currentEditingLayer.unbindTooltip();
                }
                currentEditingLayer.bindTooltip(newName, { permanent: false, direction: 'top', offset: [0, -20] });
            } else {
                const newAreaType = editAreaTypeSelect.value;
                currentEditingLayer.feature.properties.name = newName;
                currentEditingLayer.feature.properties.area = newAreaType;
                currentEditingLayer.setStyle(colorOptions[newAreaType]);

                let tooltipContent = newName;
                if (newTags.length > 0) {
                    tooltipContent += ` (${newTags.join(', ')})`;
                }
                currentEditingLayer._tooltip.setContent(tooltipContent);
            }

            updateSidebar();
            saveToLocalStorage();
            closeEditModal();
            filterMapLayers();
        };

        if (cancelEditBtn) cancelEditBtn.onclick = () => {
            closeEditModal();
        };
    } // End if (isAdminView) for modal listeners

    function saveToLocalStorage() {
        const data = drawnItems.toGeoJSON();
        localStorage.setItem('savedMapData', JSON.stringify(data));
    }

    function loadFromLocalStorage() {
        const data = localStorage.getItem('savedMapData');
        if (!data) return;

        const geojson = JSON.parse(data);

        L.geoJSON(geojson, {
            onEachFeature: (feature, layer) => {
                layer.feature = feature;
                if (!feature.properties.tags) {
                    feature.properties.tags = [];
                }
                if (typeof feature.properties.isUnderMaintenance === 'undefined') {
                    feature.properties.isUnderMaintenance = false;
                }

                if (layer instanceof L.Marker) {
                    const iconName = feature.properties.icon || 'default_marker';
                    layer.setIcon(getMarkerIcon(iconName));
                    if (isAdminView) { // Kun draggable i admin-visning
                        layer.options.draggable = true;
                    }

                    let popupContent = `<b>${feature.properties.name || 'Markør'}</b>`;
                    if (feature.properties.tags && feature.properties.tags.length > 0) {
                        popupContent += `<br>Tags: ${feature.properties.tags.join(', ')}`;
                    }
                    if (feature.properties.isUnderMaintenance) {
                        popupContent += `<br><span style="color: red; font-weight: bold;">Vedlikehold pågår</span>`;
                    }
                    if (feature.properties.imageData) {
                        popupContent += `<br><img src="${feature.properties.imageData}" style="max-width:200px; max-height:150px; margin-top: 10px;">`;
                    }
                    layer.bindPopup(popupContent);

                    if (layer._tooltip) {
                        layer.unbindTooltip();
                    }
                    layer.bindTooltip(feature.properties.name || 'Markør', { permanent: false, direction: 'top', offset: [0, -20] });

                    if (isAdminView) { // Kun contextmenu i admin-visning
                        layer.on('contextmenu', (e) => {
                            L.DomEvent.stopPropagation(e);
                            openEditModal(layer);
                        });
                    }

                    if (isAdminView) { // Kun dragend i admin-visning
                        layer.on('dragend', function(e) {
                            if (layer._maintenanceCircle) {
                                layer._maintenanceCircle.setLatLng(layer.getLatLng());
                            }
                            saveToLocalStorage();
                        });
                    }
                    updateMaintenanceCircle(layer);

                } else {
                    const area = feature.properties.area || 'Basketpool';
                    const name = feature.properties.name || area;

                    const style = colorOptions[area] || colorOptions['Basketpool'];
                    layer.setStyle(style);

                    let tooltipContent = name;
                    if (feature.properties.tags && feature.properties.tags.length > 0) {
                        tooltipContent += ` (${feature.properties.tags.join(', ')})`;
                    }
                    layer.bindTooltip(tooltipContent, { permanent: true, direction: 'center', offset: [0, 0] }).openTooltip();

                    if (isAdminView) { // Kun contextmenu i admin-visning
                        layer.on('contextmenu', (e) => {
                            L.DomEvent.stopPropagation(e);
                            openEditModal(layer);
                        });
                    }
                }
                drawnItems.addLayer(layer);
            }
        });
    }

    function updateSidebar() {
        // Disse elementene finnes kun i admin.html
        if (!areaList || !markerList) return;

        areaList.innerHTML = '';
        markerList.innerHTML = '';

        let hasAreas = false;
        let hasMarkers = false;
        const searchTermLower = currentSearchTerm.toLowerCase();

        drawnItems.eachLayer(layer => {
            if (shouldLayerBeVisible(layer, searchTermLower)) {
                const name = layer.feature?.properties?.name || (layer instanceof L.Marker ? 'Markør' : 'Område');
                const tags = layer.feature?.properties?.tags || [];
                const tagsSpanText = tags.length > 0 ? ` (${tags.join(', ')})` : '';

                const li = document.createElement('li');
                const nameSpan = document.createElement('span');
                nameSpan.textContent = name;
                if (tagsSpanText) {
                    const tagsSmall = document.createElement('small');
                    tagsSmall.textContent = tagsSpanText;
                    tagsSmall.style.fontStyle = 'italic';
                    tagsSmall.style.marginLeft = '5px';
                    nameSpan.appendChild(tagsSmall);
                }
                if (layer instanceof L.Marker && layer.feature?.properties?.isUnderMaintenance) {
                    const maintenanceSpan = document.createElement('span');
                    maintenanceSpan.textContent = ' (Vedlikehold)';
                    maintenanceSpan.style.color = 'red';
                    maintenanceSpan.style.fontWeight = 'bold';
                    maintenanceSpan.style.marginLeft = '5px';
                    nameSpan.appendChild(maintenanceSpan);
                }

                nameSpan.style.flexGrow = '1';
                nameSpan.style.userSelect = 'none';

                nameSpan.onclick = () => {
                    if (layer instanceof L.Marker) {
                        map.setView(layer.getLatLng(), 18);
                    } else {
                        map.fitBounds(layer.getBounds());
                    }
                };

                // Kun vis sletteknappen i admin-visning
                if (isAdminView) {
                    const delBtn = document.createElement('button');
                    delBtn.textContent = 'Slett';
                    delBtn.title = 'Slett dette laget';
                    delBtn.onclick = (e) => {
                        e.stopPropagation();
                        drawnItems.removeLayer(layer);
                        if (layer instanceof L.Marker && layer._maintenanceCircle) {
                            layer._maintenanceCircle.remove();
                            delete layer._maintenanceCircle;
                        }
                        updateSidebar();
                        saveToLocalStorage();
                        filterMapLayers();
                    };
                    li.appendChild(delBtn);
                }

                li.appendChild(nameSpan); // Legg til nameSpan sist for å få delete-knappen til høyre

                if (layer instanceof L.Marker) {
                    markerList.appendChild(li);
                    hasMarkers = true;
                } else {
                    areaList.appendChild(li);
                    hasAreas = true;
                }
            }
        });

        if (!hasAreas) {
            const li = document.createElement('li');
            li.textContent = 'Ingen områder';
            li.style.fontStyle = 'italic';
            areaList.appendChild(li);
        }
        if (!hasMarkers) {
            const li = document.createElement('li');
            li.textContent = 'Ingen markører';
            li.style.fontStyle = 'italic';
            markerList.appendChild(li);
        }
    }

    // Hendelseslyttere for tegning/redigering/sletting KUN i admin-visning
    if (isAdminView) {
        map.on(L.Draw.Event.CREATED, e => {
            const layer = e.layer;
            shapeIdCounter++;

            if (layer instanceof L.Marker) {
                layer.feature = {
                    type: "Feature",
                    properties: {
                        id: `marker-${shapeIdCounter}`,
                        name: "Ny markør",
                        icon: 'default_marker',
                        imageData: null,
                        tags: [],
                        isUnderMaintenance: false
                    }
                };
                layer.setIcon(getMarkerIcon('default_marker'));
                layer.options.draggable = true;
                layer.bindTooltip("Ny markør", { permanent: false, direction: 'top', offset: [0, -20] });
                layer.bindPopup("<b>Ny markør</b>");

                layer.on('contextmenu', (event) => {
                    L.DomEvent.stopPropagation(event);
                    openEditModal(layer);
                });

                layer.on('dragend', function(event) {
                    if (layer._maintenanceCircle) {
                        layer._maintenanceCircle.setLatLng(layer.getLatLng());
                    }
                    saveToLocalStorage();
                });

            } else {
                const defaultArea = 'Basketpool';
                layer.feature = {
                    type: "Feature",
                    properties: {
                        id: `area-${shapeIdCounter}`,
                        area: defaultArea,
                        name: "Nytt område",
                        tags: []
                    }
                };

                layer.setStyle(colorOptions[defaultArea]);
                layer.bindTooltip("Nytt område", { permanent: true, direction: 'center', offset: [0, 0] }).openTooltip();

                layer.on('contextmenu', (event) => {
                    L.DomEvent.stopPropagation(event);
                    openEditModal(layer);
                });
            }

            drawnItems.addLayer(layer);
            updateSidebar();
            saveToLocalStorage();
            openEditModal(layer);
            filterMapLayers();
        });

        map.on(L.Draw.Event.DELETED, (e) => {
            e.layers.eachLayer(layer => {
                if (layer instanceof L.Marker && layer._maintenanceCircle) {
                    layer._maintenanceCircle.remove();
                    delete layer._maintenanceCircle;
                }
            });
            updateSidebar();
            saveToLocalStorage();
            filterMapLayers();
        });

        map.on(L.Draw.Event.EDITED, () => {
            saveToLocalStorage();
            updateSidebar();
            filterMapLayers();
        });

        if (clearDataBtn) {
            clearDataBtn.onclick = () => {
                if (confirm('Er du sikker på at du vil slette all kartdata? Dette kan ikke angres.')) {
                    localStorage.clear();
                    drawnItems.clearLayers();
                    map.eachLayer(layer => {
                        if (layer instanceof L.Circle && layer._isMaintenanceCircle) {
                            layer.remove();
                        }
                    });

                    updateSidebar();
                    filterMapLayers();
                    alert('All kartdata er slettet.');
                }
            };
        }
    } // End if (isAdminView) for map events


    // --- Search bar event listeners ---
    let searchTimeout;
    const SEARCH_DEBOUNCE_DELAY = 300;

    if (searchInput) {
        searchInput.addEventListener('keyup', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentSearchTerm = searchInput.value.trim();
                filterMapLayers();
                updateSidebar(); // Kall bare hvis sidebar er aktivert
            }, SEARCH_DEBOUNCE_DELAY);
        });
    }

    if (searchButton) {
        searchButton.onclick = () => {
            clearTimeout(searchTimeout);
            currentSearchTerm = searchInput.value.trim();
            filterMapLayers();
            updateSidebar(); // Kall bare hvis sidebar er aktivert
        };
    }

    // Initial setup calls
    if (isAdminView) { // Kun kall disse hvis det er admin-visning
        populateModalOptions();
        setupFilterButtons();
    }
    loadFromLocalStorage();
    updateSidebar(); // Kall updateSidebar selv i fremvisningsmodus for å vise "ingen" meldinger
    filterMapLayers();

    // Veldig viktig for Leaflet at kartet justeres når det blir synlig
    map.invalidateSize();
}