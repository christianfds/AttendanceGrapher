FROM python:3.13.2-alpine

COPY . /static

EXPOSE 80

CMD ["python", "-m", "http.server", "80", "--bind", "0.0.0.0", "--directory", "/static"]
