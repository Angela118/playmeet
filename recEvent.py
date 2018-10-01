import numpy as np
import csv
from numpy import array
from scipy.spatial import distance
import warnings
import sys
warnings.filterwarnings('always')
warnings.filterwarnings('ignore')


def swap(x, i, j):
    x[i], x[j] = x[j], x[i]



#파일 불러오기 
file = open('C:/Users/user/brackets_nodejs/playmeet/recEvent.csv', 'r', encoding='UTF8')
reader = csv.reader(file)

data=[]
for row_list in reader:
    data.append(row_list)
  
file.close()


header = []
header = data[0]

del data[0]

original_data = data.copy()


print(original_data)
print()  


original_review=[]
for i in range(0, len(data)):
    original_review.append([data[i][7],data[i][8]])

print(original_review)
print()

#리뷰 없는 경우 처리
for i in range(0, len(data)):
    if(data[i][7] == "리뷰없음"):
        data[i][7] = '3'
        if(data[i][8] == "리뷰없음"):
            data[i][8] = '3'

print(data)
print()   


#data의 id값 
idArray = []
del data[0][0]
for i in range(1, len(data)):
    idArray.append(data[i][0])
    del data[i][0]


data = np.array(data)
data = data[:, 0:8]


print(data)
print()


data = data.astype('float64')


#scaling
for i in range(0, len(data)):
    data[i][4] = data[i][4] * 10
    data[i][5] = data[i][5] * 10
    data[i][6] = data[i][6] * 10
    data[i][7] = data[i][7] * 10
    print(data[i][0])
    print(data[i][1])
    print(data[i][2])
    print(data[i][3])
    print(data[i][4])
    print(data[i][5])
    print(data[i][6])
    print(data[i][7])
    print()


#euclidean distance
euc_dst = []
for i in range(1, len(data)):
    euc_dst.append(distance.euclidean(data[0], data[i]))

print(euc_dst)
print()

ar_euc = []
for i in range(0, len(euc_dst)):
    ar_euc.append([i+1, euc_dst[i]])
    
print(ar_euc)
print()



#sorting    
for size in reversed(range(len(ar_euc))):
    for i in range(size):
        if ar_euc[i][1]>ar_euc[i+1][1]:
            swap(ar_euc, i, i+1)

print(ar_euc)
print()

#값 되돌리기                
result_data = []
for i in range(0, len(ar_euc)):
    result_data.append(original_data[ar_euc[i][0]])
    result_data[i].insert(0, idArray[ar_euc[i][0]-1])
    result_data[i][7] = original_review[i+1][0]
    result_data[i][8] = original_review[i+1][1]

print(result_data)
print()

result_data.insert(0, header)







#recOutput.csv에 저장 
with open('C:/Users/user/brackets_nodejs/playmeet/recOutput.csv','w', encoding='UTF8', newline='') as output:
    writer = csv.writer(output)
    for val in result_data:
        writer.writerow(val)

          
print()

    

    

