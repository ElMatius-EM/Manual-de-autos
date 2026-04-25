import requests
import os
import time
import json
from urllib.parse import quote

# ─── MODELOS A BUSCAR ────────────────────────────────────────────────────────
# Formato: ("nombre_archivo", "título exacto en Wikipedia")
AUTOS = [
    # Ford
    ("ford_fiesta",     "Ford Fiesta"),
    ("ford_focus",      "Ford Focus"),
    ("ford_ka",         "Ford Ka"),
    ("ford_ecosport",   "Ford EcoSport"),
    ("ford_ranger",     "Ford Ranger"),
    ("ford_transit",    "Ford Transit"),

    # Chevrolet
    ("chevrolet_corsa",   "Chevrolet Corsa"),
    ("chevrolet_agile",   "Chevrolet Agile"),
    ("chevrolet_cruze",   "Chevrolet Cruze"),
    ("chevrolet_onix",    "Chevrolet Onix"),
    ("chevrolet_s10",     "Chevrolet S-10"),
    ("chevrolet_tracker", "Chevrolet Tracker"),

    # Volkswagen
    ("vw_gol",      "Volkswagen Gol"),
    ("vw_polo",     "Volkswagen Polo"),
    ("vw_golf",     "Volkswagen Golf"),
    ("vw_vento",    "Volkswagen Vento"),
    ("vw_amarok",   "Volkswagen Amarok"),
    ("vw_suran",    "Volkswagen Suran"),

    # Renault
    ("renault_clio",    "Renault Clio"),
    ("renault_megane",  "Renault Mégane"),
    ("renault_logan",   "Renault Logan"),
    ("renault_sandero", "Renault Sandero"),
    ("renault_duster",  "Renault Duster"),
    ("renault_kangoo",  "Renault Kangoo"),

    # Peugeot
    ("peugeot_206",     "Peugeot 206"),
    ("peugeot_207",     "Peugeot 207"),
    ("peugeot_208",     "Peugeot 208"),
    ("peugeot_307",     "Peugeot 307"),
    ("peugeot_308",     "Peugeot 308"),
    ("peugeot_partner", "Peugeot Partner"),

    # Fiat
    ("fiat_palio",  "Fiat Palio"),
    ("fiat_punto",  "Fiat Punto"),
    ("fiat_siena",  "Fiat Siena"),
    ("fiat_cronos", "Fiat Cronos"),
    ("fiat_strada", "Fiat Strada"),
    ("fiat_uno",    "Fiat Uno"),

    # Toyota
    ("toyota_corolla", "Toyota Corolla"),
    ("toyota_hilux",   "Toyota Hilux"),
    ("toyota_sw4",     "Toyota Land Cruiser Prado"),
    ("toyota_etios",   "Toyota Etios"),
    ("toyota_yaris",   "Toyota Yaris"),

    # Honda
    ("honda_civic", "Honda Civic"),
    ("honda_fit",   "Honda Fit"),
    ("honda_crv",   "Honda CR-V"),
    ("honda_hrv",   "Honda HR-V"),

    # Hyundai
    ("hyundai_accent",   "Hyundai Accent"),
    ("hyundai_i30",      "Hyundai i30"),
    ("hyundai_tucson",   "Hyundai Tucson"),
    ("hyundai_santafe",  "Hyundai Santa Fe"),
    ("hyundai_creta",    "Hyundai Creta"),

    # Citroën
    ("citroen_c3",       "Citroën C3"),
    ("citroen_c4",       "Citroën C4"),
    ("citroen_berlingo", "Citroën Berlingo"),
    ("citroen_jumper",   "Citroën Jumper"),

    # Nissan
    ("nissan_march",   "Nissan March"),
    ("nissan_sentra",  "Nissan Sentra"),
    ("nissan_frontier", "Nissan Frontier"),
    ("nissan_kicks",   "Nissan Kicks"),

    # Kia
    ("kia_rio",     "Kia Rio"),
    ("kia_cerato",  "Kia Cerato"),
    ("kia_sportage", "Kia Sportage"),
    ("kia_sorento", "Kia Sorento"),
]

AUTOS_RETRY = [
    ("chevrolet_corsa",   "Opel Corsa"),
    ("chevrolet_tracker", "Chevrolet Trax"),
    ("vw_golf",           "Volkswagen Golf Mk7"),
    ("vw_vento",          "Volkswagen Jetta"),
    ("vw_suran",          "Volkswagen SpaceFox"),
    ("renault_logan",     "Dacia Logan"),
    ("renault_sandero",   "Dacia Sandero"),
    ("renault_duster",    "Dacia Duster"),
    ("renault_kangoo",    "Renault Kangoo Van"),
    ("peugeot_206",       "Peugeot 206 CC"),
    ("peugeot_207",       "Peugeot 207 CC"),
    ("peugeot_307",       "Peugeot 307 SW"),
    ("peugeot_partner",   "Peugeot Rifter"),
    ("fiat_uno",          "Fiat Novo Uno"),
    ("hyundai_tucson",    "Hyundai Tucson (TL)"),
    ("hyundai_santafe",   "Hyundai Santa Fe (TM)"),
    ("hyundai_creta",     "Hyundai ix25"),
    ("citroen_berlingo",  "Citroën Berlingo (2018)"),
    ("citroen_jumper",    "Fiat Ducato"),
    ("nissan_march",      "Nissan Micra"),
    ("nissan_sentra",     "Nissan Sylphy"),
    ("nissan_frontier",   "Nissan Navara"),
    ("kia_rio",           "Kia Rio (YB)"),
    ("kia_cerato",        "Kia Forte"),
    ("kia_sportage",      "Kia Sportage (QL)"),
    ("kia_sorento",       "Kia Sorento (UM)"),
]

# ─── CONFIGURACIÓN ───────────────────────────────────────────────────────────
# Cambiá a AUTOS_RETRY para reintentar los fallidos con títulos alternativos
LISTA_ACTIVA = AUTOS

OUTPUT_DIR = "img/autos"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://en.wikipedia.org/"
}


def obtener_imagen_wikipedia(titulo):
    """Obtiene la URL de la imagen principal del infobox de un artículo de Wikipedia."""
    url = "https://en.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "titles": titulo,
        "prop": "pageimages",
        "pithumbsize": 600,
        "format": "json"
    }
    try:
        r = requests.get(url, params=params, headers=HEADERS, timeout=10)
        data = r.json()
        pages = data["query"]["pages"]
        page = next(iter(pages.values()))
        if "thumbnail" in page:
            return page["thumbnail"]["source"]
        return None
    except Exception as e:
        print(f"  Error API: {e}")
        return None


def descargar_imagen(url_img, nombre_archivo):
    """Descarga una imagen y la guarda como JPG."""
    try:
        r = requests.get(url_img, headers=HEADERS, timeout=15)
        if r.status_code == 200:
            ext = ".jpg" if "jpg" in url_img.lower() or "jpeg" in url_img.lower() else ".png"
            ruta = os.path.join(OUTPUT_DIR, nombre_archivo + ext)
            with open(ruta, "wb") as f:
                f.write(r.content)
            return ruta
        # Si falla y es SVG, intentar versión PNG de Wikimedia
        if ".svg" in url_img.lower():
            url_png = url_img.replace("/svg/", "/png/").replace(".svg", ".png")
            try:
                r2 = requests.get(url_png, headers=HEADERS, timeout=15)
                if r2.status_code == 200:
                    ruta = os.path.join(OUTPUT_DIR, nombre_archivo + ".png")
                    with open(ruta, "wb") as f:
                        f.write(r2.content)
                    return ruta
            except:
                pass
        return None
    except Exception as e:
        print(f"  Error descarga: {e}")
        return None


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    resultados = {}
    ok = 0
    fail = 0

    print(f"Descargando imágenes para {len(LISTA_ACTIVA)} modelos...\n")

    for nombre_archivo, titulo_wiki in LISTA_ACTIVA:
        ruta_existente = None
        for ext in [".jpg", ".png"]:
            p = os.path.join(OUTPUT_DIR, nombre_archivo + ext)
            if os.path.exists(p):
                ruta_existente = p
                break

        if ruta_existente:
            print(f"  [SKIP] {titulo_wiki} — ya existe")
            resultados[nombre_archivo] = ruta_existente
            ok += 1
            continue

        print(f"  [{ok+fail+1}/{len(AUTOS)}] {titulo_wiki}...", end=" ")
        url_img = obtener_imagen_wikipedia(titulo_wiki)

        if not url_img:
            print("sin imagen")
            fail += 1
            continue

        ruta = descargar_imagen(url_img, nombre_archivo)
        if ruta:
            print(f"OK → {ruta}")
            resultados[nombre_archivo] = ruta
            ok += 1
        else:
            print("error al descargar")
            fail += 1

        time.sleep(0.5)  # respetar rate limit de Wikipedia

    print(f"\n─── Resumen ───────────────────────")
    print(f"  Descargadas: {ok}")
    print(f"  Fallidas:    {fail}")

    # Guardar mapa nombre→ruta para usar en el JS
    with open("img/autos/mapa_imagenes.json", "w") as f:
        json.dump(resultados, f, indent=2)
    print(f"\nMapa guardado en img/autos/mapa_imagenes.json")


if __name__ == "__main__":
    main()
