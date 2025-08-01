export class BadRequest extends Error {
  constructor(message) {
    super(message);
    this.name = 'BadRequest';
    this.status = 400;
    this.code = 'BadRequest';
  }
}

export class NotFound extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFound';
    this.status = 404;
    this.code = 'NotFound';
  }
}

// Puedes agregar más clases de error personalizadas aquí si es necesario
