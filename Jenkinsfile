node('ecs') {
  deleteDir()

  stage 'Checkout'
  checkout scm

  stage 'D/L dependencies'
  sh 'gem install bundler'
  sh 'bundle'

  stage 'Build'
  sh 'rake build:production'

  stage 'Test'
  try {
    sh 'rake test:production'
  } catch (err) {
    currentBuild.result = 'UNSTABLE'
  }

  stage 'Build production'
  sh 'rake build:production'
  archive 'output/**'

  stash includes: 'output/**', name: 'built-site'
}

if (currentBuild.result == 'UNSTABLE') {
  echo 'Skipping deployment due to unstable build'
} else {

  stage 'Deploy'
  node() {
    deleteDir()
    unstash 'built-site'

    withAWS(region:'us-east-1',credentials:'cc-jenkins') {
      s3Upload(bucket:"${env.HOST}", path:'/', includePathPattern:'**/*', workingDir:'_site')
      cfInvalidate(distribution:'someDistributionId', paths:['/*'])
    }
  }
}
