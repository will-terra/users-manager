.PHONY: setup backend frontend db test

setup: backend frontend

backend:
	cd backend && bundle install

frontend:
	cd frontend && npm install

db:
	cd backend && rails db:create db:migrate

test:
	cd backend && bundle exec rspec
	cd frontend && npm test
