const databaseName = "personal-home-wallpaper";
const storeName = "images";
const wallpaperKey = "selected";

const openWallpaperDatabase = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(storeName);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export const saveCustomWallpapers = async (files) => {
  const database = await openWallpaperDatabase();
  try {
    const ids = files.map(() => {
      const uniqueId =
        globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      return `custom:${Date.now()}-${uniqueId}`;
    });
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      files.forEach((file, index) => store.put(file, ids[index]));
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    return ids;
  } finally {
    database.close();
  }
};

export const saveCustomWallpaper = async (file) => (await saveCustomWallpapers([file]))[0];

export const listCustomWallpapers = async () => {
  const database = await openWallpaperDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const wallpapers = [];
      const transaction = database.transaction(storeName, "readonly");
      const request = transaction.objectStore(storeName).openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          resolve(wallpapers);
          return;
        }
        wallpapers.push({
          id: cursor.key === wallpaperKey ? "custom" : cursor.key,
          name: cursor.value.name || "自定义壁纸",
        });
        cursor.continue();
      };
      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
};

export const loadCustomWallpaper = async (id = "custom") => {
  const database = await openWallpaperDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, "readonly");
      const request = transaction.objectStore(storeName).get(id === "custom" ? wallpaperKey : id);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
};
