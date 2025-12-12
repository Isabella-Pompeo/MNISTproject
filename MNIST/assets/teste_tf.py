import tensorflow as tf

# 1. Cria um Tensor (uma matriz multidimensional)
# O Tensor é o tipo de dado fundamental do TensorFlow
vetor_a = tf.constant([5.0, 10.0, 15.0, 20.0])

# 2. Realiza uma operação de Machine Learning/Álgebra Linear
# Neste caso, a soma de todos os elementos
soma_total = tf.reduce_sum(vetor_a)

# 3. Imprime o resultado
print("--- Teste de Instalação do TensorFlow ---")
print("Tensor de entrada:", vetor_a)
print("Resultado da soma:", soma_total)
print("A instalação está funcionando corretamente!")