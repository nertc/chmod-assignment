const fsPromises = require("fs/promises");
const fs = require("fs");

let folderPerms = [
  {
    name: "folder-01",
    perm: "700",
  },
  {
    name: "folder-02",
    perm: "744",
  },
  {
    name: "folder-03",
    perm: "777",
  },
];

async function chmod() {
  let folders = folderPerms.map(({ name, perm }) => ({
    name: __dirname + "/" + name,
    perm,
  }));

  const isFiltered = await Promise.all(
    folders.map((folder) => {
      if (!fs.existsSync(folder.name)) {
        return fsPromises
          .mkdir(folder.name)
          .then(() => ({
            folder,
            status: true,
          }))
          .catch(() => ({
            folder,
            status: false,
          }));
      }
      return Promise.resolve().then(() => ({
        folder,
        status: true,
      }));
    })
  );

  folders = folders.filter((folder) =>
    isFiltered.some(
      (filterObj) => filterObj.folder === folder && filterObj.status
    )
  );

  folders = await Promise.all(
    folders.map(async ({ name, perm }) => {
      const files = await fsPromises
        .readdir(name)
        .then((files) => files.map((file) => `${name}/${file}`));
      return {
        name,
        perm,
        files,
      };
    })
  );

  return await Promise.all(
    folders.map((folder) =>
      Promise.all(
        folder.files.map((file) => fsPromises.chmod(file, folder.perm))
      ).then(() => folder.name)
    )
  );
}

console.log("starting...");
chmod()
  .then((folders) => folders.reduce((acc, cur) => `${acc}${cur}\n`, ""))
  .then((folders) => console.log(`${folders}were updated`))
  .catch(console.error);
