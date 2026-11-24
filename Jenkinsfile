
pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Fetching project from GitHub...'
                checkout scm
            }
        }

        stage('Build') {
            steps {
                echo 'Building the Java web application using Maven...'
                sh 'mvn clean package'
            }
        }

        stage('Docker Build') {
            steps {
                echo 'Building Docker image with Tomcat...'
                sh 'docker build -t taskmanagementsite:latest .'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying application on EC2...'

                sh 'docker stop taskapp || true'
                sh 'docker rm taskapp || true'

                sh 'docker run -d --name taskapp --restart unless-stopped -p 8081:8080 taskmanagementsite:latest'
            }
        }
    }

    post {
        success {
            echo 'Application deployed successfully!'
        }

        failure {
            echo 'Pipeline failed. Check the console output.'
        }
    }
}
