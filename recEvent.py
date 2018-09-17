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
file = open('D:/coding test/javascriptTest/playmeet-final/recEvent.csv', 'r', encoding='UTF8')
reader = csv.reader(file)

data=[]
for row_list in reader:
    data.append(row_list)
  
file.close()

print(data)
print()

header = []
header = data[0]

del data[0]



#scaling
for i in range(0, len(data)):
    data[i][4] = data[i][4] + '0'

        
dat = data[:]
    
    
#data의 id값 
idArray = []
del data[0][0]
for i in range(1, len(data)):
    idArray.append(data[i][0])
    del data[i][0]


if(len(data)>1):        
    if(type(data[1][8]) == 'str'):
        data = np.array(data)
        data = data[:, 0:9]
    else:
        data = np.array(data)
        data = data[:, 0:7]
else:
    data = np.array(data)
    data = data[:, 0:7]
    

print(data)
print()


data = data.astype('float64')


print(data)
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
                

result_data = []
for i in range(0, len(ar_euc)):
    result_data.append(dat[ar_euc[i][0]])
    result_data[i].insert(0, idArray[ar_euc[i][0]-1])


#scaling 되돌리기
for i in range(0, len(result_data)):
    result_data[i][4] = result_data[i][4][0:len(result_data[i][4])-1]


result_data.insert(0, header)


print(result_data)
print()




#recOutput.csv에 저장 
with open('D:/coding test/javascriptTest/playmeet-final/recOutput.csv','w', encoding='UTF8', newline='') as output:
    writer = csv.writer(output)
    for val in result_data:
        writer.writerow(val)

          
print()

    

    

