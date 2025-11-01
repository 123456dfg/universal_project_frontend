import('nipplejs').then((module) => {
  console.log('nipplejs module:', module);
  console.log('typeof module:', typeof module);
  console.log('module keys:', Object.keys(module));
  
  if (module.default) {
    console.log('module.default:', module.default);
    console.log('typeof module.default:', typeof module.default);
  }
  
  if (module.create) {
    console.log('module.create:', module.create);
    console.log('typeof module.create:', typeof module.create);
  }
});